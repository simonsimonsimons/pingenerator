// api/suggest.js (Verbesserte Version)
const fetch = require('node-fetch');

// --- TEIL 1: Definition der Konstanten ---
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash";

if (GEMINI_MODEL_ID.startsWith("models/")) {
  GEMINI_MODEL_ID = GEMINI_MODEL_ID.replace(/^models\//, "");
}
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${GOOGLE_API_KEY}`;

function generateAmazonAffiliateLink(produktName) {
  const amazonTag = process.env.AFFILIATE_ID_AMAZON || "";
  if (!produktName) return "#";
  const encodedQuery = encodeURIComponent(produktName.trim());
  return amazonTag
    ? `https://www.amazon.de/s?k=${encodedQuery}&tag=${amazonTag}`
    : `https://www.amazon.de/s?k=${encodedQuery}`;
}

// --- TEIL 2: Die Handler-Funktion mit neuem Prompt ---
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { alter = "", beruf = "", hobby = "", anlass = "", stil = "", budget = "" } = req.body;

  // NEUER, SICHERERER PROMPT:
  // Wir fragen nicht mehr nach Plattformen, um die Sicherheitsfilter zu umgehen.
  // Wir gehen davon aus, dass alle Produkte auf Amazon gesucht werden sollen.
  const prompt = `
Du bist ein kreativer Geschenkideen-Experte. Deine Aufgabe ist es, einen hilfreichen Geschenke-Ratgeber zu erstellen.

SCHRITT 1: Erstelle eine Liste von genau 10 einzigartigen Geschenkideen, die zu den folgenden Kriterien passen. Gib die Liste als JSON-ARRAY zurück:
[
  { "produkt": "Name des Produkts oder der Produktkategorie", "beschreibung": "Eine kurze, ansprechende Beschreibung der Geschenkidee." },
  ...
]

SCHRITT 2: Schreibe basierend auf den Ideen einen hochwertigen, HTML-formatierten Blogartikel (ca. 400-600 Wörter).
- Der Artikel soll eine einladende Überschrift (h1) und eine klare Struktur mit Zwischenüberschriften (h2, h3) haben.
- Integriere die 10 Geschenkideen natürlich in den Text. Markiere dabei den Produktnamen mit spitzen Klammern, z.B. <Produktname>, damit dieser später verlinkt werden kann.
- Der Schreibstil sollte zum Anlass und zur Zielperson passen.

Hier sind die Kriterien für die Geschenke:
- Anlass: ${anlass}
- Zielperson: Alter ca. ${alter}, Beruf/Typ: ${beruf}, Hobbies: ${hobby}
- Stil: ${stil}
- Budget: ${budget}

GIB DEINE ANTWORT AUSSCHLIESSLICH IM FOLGENDEN JSON-FORMAT ZURÜCK. BEGINNE DIREKT MIT DER { Und höre mit der } auf. KEIN TEXT DAVOR ODER DANACH.
{
  "ideas": [
    { "produkt": "...", "beschreibung": "..." },
    ...
  ],
  "blog": "<h1>Titel</h1><p>...</p>..."
}`;

  let rawResponseFromAI = "";
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Wir fügen eine Safety Setting hinzu, um die Wahrscheinlichkeit von Blockaden zu reduzieren
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Gemini API-Fehler:", response.status, errText);
      return res.status(502).json({ error: "Fehler bei der Kommunikation mit der AI." });
    }

    const result = await response.json();

    // Verbesserte Fehlerprüfung: Überprüfen, ob die Antwort blockiert wurde
    if (!result.candidates || result.candidates.length === 0) {
      console.error("❌ Antwort von der KI blockiert oder leer. Finish Reason:", result.promptFeedback?.blockReason);
      console.error("Safety Ratings:", JSON.stringify(result.promptFeedback?.safetyRatings, null, 2));
      return res.status(500).json({ error: 'Die KI-Anfrage wurde aus Sicherheitsgründen blockiert.' });
    }

    rawResponseFromAI = result.candidates[0].content.parts[0].text || "";
    const cleanedJsonString = rawResponseFromAI.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanedJsonString);
    
    // Die Links werden jetzt immer mit der Amazon-Funktion generiert
    const ideas = parsed.ideas.map((idee) => ({
      ...idee,
      affiliate_link: generateAmazonAffiliateLink(idee.produkt)
    }));

    let blogHtml = parsed.blog;
    for (const idee of ideas) {
      const regex = new RegExp(`<${idee.produkt}>`, "g");
      const anchor = `<a href="${idee.affiliate_link}" target="_blank" rel="noopener noreferrer">${idee.produkt}</a>`;
      blogHtml = blogHtml.replace(regex, anchor);
    }

    return res.status(200).json({ ideas, blog: blogHtml });
  } catch (err) {
    console.error("❌ Fehler bei Verarbeitung:", err.message);
    console.error("Roh-Antwort von der KI, die den Fehler verursachte:", rawResponseFromAI);
    return res.status(500).json({ error: "Fehler bei der Verarbeitung der AI-Antwort." });
  }
};
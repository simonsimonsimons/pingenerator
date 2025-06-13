// api/suggest.js (Saubere, korrigierte Version)
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
  if (!produktName || produktName.trim() === "") return "#";
  const encodedQuery = encodeURIComponent(produktName.trim());
  return amazonTag
    ? `https://www.amazon.de/s?k=${encodedQuery}&tag=${amazonTag}`
    : `https://www.amazon.de/s?k=${encodedQuery}`;
}

// Dies ist die Funktion, die korrigiert werden muss.
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& bedeutet die gesamte gefundene Zeichenkette
}

// --- TEIL 2: Die Handler-Funktion ---
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { alter = "", beruf = "", hobby = "", anlass = "", stil = "", budget = "" } = req.body;

  const prompt = `
Du bist ein kreativer Geschenkideen-Experte. Deine Aufgabe ist es, einen hilfreichen Geschenke-Ratgeber zu erstellen.

SCHRITT 1: Erstelle eine Liste von genau 10 einzigartigen Geschenkideen, die zu den folgenden Kriterien passen. Gib die Liste als JSON-ARRAY zurück.
**WICHTIG: Die Geschenkideen sollen gängige und auf Amazon leicht auffindbare Produkte sein. Vermeide sehr spezielle oder handgefertigte Einzelstücke.**
[
  { "produkt": "Allgemeiner, suchbarer Produktname", "beschreibung": "Eine kurze, ansprechende Beschreibung." },
  ...
]

SCHRITT 2: Schreibe einen hochwertigen, HTML-formatierten Blogartikel (ca. 400-600 Wörter).
- Integriere die 10 Geschenkideen natürlich in den Text und generiere am Schluss nochmal eine Top 10 Liste. Markiere dabei den Produktnamen exakt wie in der Liste oben und umschließe ihn mit spitzen Klammern, z.B. <Produktname>.
- SEHR WICHTIG: Der Inhalt des "blog"-Feldes darf unter keinen Umständen Markdown-Formatierung wie Backticks (\`), Sternchen für Fett- oder Kursivschrift oder \`\`\` enthalten. Es muss reiner, valider HTML-Code sein (<h1>, <h2>, <p>, <a>, etc.).

Hier sind die Kriterien:
- Anlass: ${anlass}
- Zielperson: Alter ca. ${alter}, Beruf/Typ: ${beruf}, Hobbies: ${hobby}
- Stil: ${stil}
- Budget: ${budget}

GIB DEINE ANTWORT AUSSCHLIESSLICH IM FOLGENDEN JSON-FORMAT ZURÜCK. DEINE ANTWORT MUSS MIT { beginnen und mit } enden. KEIN ANDERER TEXT ODER FORMATIERUNG AUSSERHALB DIESES JSON-OBJEKTS.
{
  "ideas": [...],
  "blog": "<h1>Titel</h1><p>...</p>..."
}`;

  let rawResponseFromAI = "";
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      return res.status(502).json({ error: "Fehler bei der Kommunikation mit der AI." });
    }

    const result = await response.json();

    if (!result.candidates || result.candidates.length === 0) {
      return res.status(500).json({ error: 'Die KI-Anfrage wurde aus Sicherheitsgründen blockiert.' });
    }

    rawResponseFromAI = result.candidates[0].content.parts[0].text || "";
    
    const firstBraceIndex = rawResponseFromAI.indexOf('{');
    const lastBraceIndex = rawResponseFromAI.lastIndexOf('}');
    
    if (firstBraceIndex === -1 || lastBraceIndex === -1) {
        throw new Error("Antwort der KI enthielt kein valides JSON-Objekt.");
    }
    
    const jsonString = rawResponseFromAI.substring(firstBraceIndex, lastBraceIndex + 1);
    const parsed = JSON.parse(jsonString);
    
    const ideas = parsed.ideas.map((idee) => ({
      ...idee,
      affiliate_link: generateAmazonAffiliateLink(idee.produkt)
    }));

    let blogHtml = parsed.blog;
    for (const idee of ideas) {
      const escapedProdukt = escapeRegExp(idee.produkt || "");
      if (!escapedProdukt) continue;

      const regex = new RegExp(`<${escapedProdukt}>`, "gi");
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

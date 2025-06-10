// api/suggest.js (Korrigierte Version)

// ... (Ihr Code für GOOGLE_API_KEY, generateAffiliateLink etc. bleibt hier unverändert)
const fetch = require('node-fetch'); // Stellen Sie sicher, dass fetch importiert ist, falls nicht schon geschehen

// ... (Ihre Konstanten und die generateAffiliateLink-Funktion von oben)

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { alter = "", beruf = "", hobby = "", anlass = "", stil = "", budget = "" } = req.body;

  const prompt = `
Du bist ein kreativer Geschenkideen-Experte.

1️⃣ Erstelle zuerst genau 10 Geschenkideen die es auf Amazon gibt als JSON-ARRAY:
[
  { "produkt": "<Produktname>", "beschreibung": "<Kurzbeschreibung>", "plattform": "Amazon|Otto|Etsy" },
  ...
]

2️⃣ Danach erstelle einen HTML-Blogartikel (max. 600 Wörter) mit passender Headline, h2/h3-Struktur, Absätzen und Conversion-fokussierter Sprache. Integriere die 10 Geschenkideen im Fließtext – **jeweils mit dem Produktnamen in spitzen Klammern** (z. B. <Kauknochen XXL>), damit sie später ersetzt werden können.

Nutze diese Informationen:
Alter: ${alter}
Beruf: ${beruf}
Hobby: ${hobby}
Anlass: ${anlass}
Stil: ${stil}
Budget: ${budget}

Antwortformat:
{
  "ideas": [...],
  "blog": "<html>...</html>"
}
NUR dieses JSON zurückgeben.`;

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Gemini API-Fehler:", response.status, errText);
      return res.status(502).json({ ideas: [], blog: "" });
    }

    const result = await response.json();
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // NEU: Bereinigen des Strings von Markdown-Codeblöcken
    const cleanedJsonString = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();

    const parsed = JSON.parse(cleanedJsonString); // NEU: Den bereinigten String parsen
    
    const ideas = parsed.ideas.map((idee) => ({
      ...idee,
      affiliate_link: generateAffiliateLink(idee.produkt, idee.plattform)
    }));

    let blogHtml = parsed.blog;
    for (const idee of ideas) {
      const regex = new RegExp(`<${idee.produkt}>`, "g");
      const anchor = `<a href="${idee.affiliate_link}" target="_blank" rel="noopener noreferrer">${idee.produkt}</a>`;
      blogHtml = blogHtml.replace(regex, anchor);
    }

    return res.status(200).json({ ideas, blog: blogHtml });
  } catch (err) {
    console.error("❌ Fehler bei Verarbeitung:", err);
    // Loggen Sie den rohen Text, um zu sehen, was die KI gesendet hat
    console.error("Roh-Text von der KI:", raw); 
    return res.status(500).json({ ideas: [], blog: "" });
  }
};
// api/suggest.js (Vollständige und korrigierte Version)
const fetch = require('node-fetch');

// --- TEIL 1: Definition der Konstanten (Dieser Teil hat gefehlt) ---

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash";

if (GEMINI_MODEL_ID.startsWith("models/")) {
  GEMINI_MODEL_ID = GEMINI_MODEL_ID.replace(/^models\//, "");
}

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${GOOGLE_API_KEY}`;

const affiliateIds = {
  amazonTag: process.env.AFFILIATE_ID_AMAZON || "",
  ottoMid: process.env.OTTO_AWIN_MERCHANT_ID || "",
  ottoAff: process.env.OTTO_AWIN_AFFILIATE_ID || "",
  etsyMid: process.env.ETSY_AWIN_MERCHANT_ID || "",
  etsyAff: process.env.ETSY_AWIN_AFFILIATE_ID || "",
};

function generateAffiliateLink(produktName, platform) {
  if (!produktName || !platform) return "#";
  const encodedQuery = encodeURIComponent(produktName.trim());
  switch (platform.toLowerCase()) {
    case "amazon":
      return affiliateIds.amazonTag
        ? `https://www.amazon.de/s?k=${encodedQuery}&tag=${affiliateIds.amazonTag}`
        : `https://www.amazon.de/s?k=${encodedQuery}`;
    case "otto": {
      const searchUrl = `https://www.otto.de/suche/${encodedQuery}/`;
      if (!affiliateIds.ottoMid || !affiliateIds.ottoAff) return searchUrl;
      const encodedOtto = encodeURIComponent(searchUrl);
      return `https://www.awin1.com/cread.php?awinmid=${affiliateIds.ottoMid}&awinaffid=${affiliateIds.ottoAff}&clickref=&ued=${encodedOtto}`;
    }
    case "etsy": {
      const searchUrl = `https://www.etsy.com/search?q=${encodedQuery}`;
      if (!affiliateIds.etsyMid || !affiliateIds.etsyAff) return searchUrl;
      const encodedEtsy = encodeURIComponent(searchUrl);
      return `https://www.awin1.com/cread.php?awinmid=${affiliateIds.etsyMid}&awinaffid=${affiliateIds.etsyAff}&clickref=&ued=${encodedEtsy}`;
    }
    default:
      return `https://www.google.com/search?q=${encodedQuery}`;
  }
}

// --- TEIL 2: Die Handler-Funktion (leicht korrigiert) ---

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { alter = "", beruf = "", hobby = "", anlass = "", stil = "", budget = "" } = req.body;

  const prompt = `
Du bist ein kreativer Geschenkideen-Experte.

1️⃣ Erstelle zuerst genau 10 Geschenkideen die auf Amazon zu finden sind als JSON-ARRAY:
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

  let rawResponseFromAI = "";
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Gemini API-Fehler:", response.status, errText);
      return res.status(502).json({ error: "Fehler bei der Kommunikation mit der AI." });
    }

    const result = await response.json();
    rawResponseFromAI = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJsonString = rawResponseFromAI.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanedJsonString);
    
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
    console.error("❌ Fehler bei Verarbeitung:", err.message);
    console.error("Roh-Antwort von der KI, die den Fehler verursachte:", rawResponseFromAI); 
    return res.status(500).json({ error: "Fehler bei der Verarbeitung der AI-Antwort." });
  }
};
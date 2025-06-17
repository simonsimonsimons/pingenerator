// /api/suggest.js
import fetch from 'node-fetch';

// Erzeugt einen Amazon-Suchlink mit Affiliate-Tag
function generateAmazonAffiliateLink(produktName) {
  const amazonTag = process.env.AFFILIATE_ID_AMAZON || "";
  if (!produktName || produktName.trim() === "") return "#";
  const encodedQuery = encodeURIComponent(produktName.trim());
  return amazonTag
    ? `https://www.amazon.de/s?k=${encodedQuery}&tag=${amazonTag}`
    : `https://www.amazon.de/s?k=${encodedQuery}`;
}

// API-Handler
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const geminiKey = process.env.GOOGLE_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash";
    const { anlass, alter, beruf, hobby, stil, budget } = req.body;

    if (!geminiKey) return res.status(500).json({ error: "Missing Gemini API Key" });

    // Prompt mit deinen Parametern
    const prompt = `
Du bist ein SEO- und Conversion-optimierter Blog-Autor.
SCHRITT 1: Erstelle eine Liste von genau 10 einzigartigen, gängigen und auf Amazon auffindbaren Geschenkideen...
// ...Rest deines Prompts, inklusive der Variablen (anlass, hobby etc.)
`;

    // Request an Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Gemini API Error: ${errText}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Affiliate-Links in <li>-Elemente einbauen
    const html = text.replace(/<li>(.*?)<\/li>/g, (match, p1) => {
      const url = generateAmazonAffiliateLink(p1);
      return `<li><a href="${url}" target="_blank" rel="noopener">${p1}</a></li>`;
    });

    res.status(200).json({ html });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server Error' });
  }
}

const fetch = require('node-fetch');

function generateAmazonAffiliateLink(produktName) {
  const amazonTag = process.env.AFFILIATE_ID_AMAZON || "";
  if (!produktName || produktName.trim() === "") return "#";
  const encodedQuery = encodeURIComponent(produktName.trim());
  return amazonTag
    ? `https://www.amazon.de/s?k=${encodedQuery}&tag=${amazonTag}`
    : `https://www.amazon.de/s?k=${encodedQuery}`;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).end(); }

  const geminiKey = process.env.GOOGLE_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash";
  const { anlass, alter, beruf, hobby, stil, budget } = req.body;

  const prompt = `
    Du bist ein SEO- und Conversion-optimierter Blog-Autor.
    SCHRITT 1: Erstelle eine Liste von genau 10 einzigartigen, gängigen und auf Amazon auffindbaren Geschenkideen. Gib die Liste als JSON-ARRAY zurück:
    [
      { "produkt": "Allgemeiner, suchbarer Produktname", "beschreibung": "Eine kurze, ansprechende Beschreibung." }
    ]

    SCHRITT 2: Schreibe basierend auf den Ideen einen hochwertigen, SEO-optimierten und HTML-formatierten Blogartikel (mindestens 500 Wörter).
    - Nutze eine fesselnde H1-Überschrift.
    - Integriere die 10 Geschenkideen natürlich in den Text. Markiere dabei den Produktnamen exakt wie in der Liste oben und umschließe ihn mit spitzen Klammern, z.B. <Produktname>.
    - Verwende Zwischenüberschriften (h2, h3) und Listen für eine gute Lesbarkeit.
    - Schreibe in einem zum Anlass passenden, überzeugenden Ton.
    
    Hier sind die Kriterien:
    - Anlass: ${anlass}, Zielperson: ca. ${alter} Jahre, ${beruf}, Hobbies: ${hobby}, Stil: ${stil}, Budget: ${budget}.

    GIB DEINE ANTWORT AUSSCHLIESSLICH IM FOLGENDEN JSON-FORMAT ZURÜCK. DEINE ANTWORT MUSS MIT { beginnen und mit } enden.
    {
      "ideas": [{"produkt": "...", "beschreibung": "..."}, ...],
      "blog": "<h1>Titel</h1><p>...</p>..."
    }`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error("Text-Generierung fehlgeschlagen");
    
    const data = await response.json();
    let rawResponseFromAI = data.candidates[0].content.parts[0].text || "";
    
    const firstBraceIndex = rawResponseFromAI.indexOf('{');
    const lastBraceIndex = rawResponseFromAI.lastIndexOf('}');
    if (firstBraceIndex === -1 || lastBraceIndex === -1) throw new Error("KI hat ungültiges JSON geliefert.");
    
    const jsonString = rawResponseFromAI.substring(firstBraceIndex, lastBraceIndex + 1);
    const parsed = JSON.parse(jsonString);

    let blogHtml = parsed.blog;
    for (const idee of parsed.ideas) {
      const escapedProdukt = escapeRegExp(idee.produkt || "");
      if (!escapedProdukt) continue;

      const affiliateLink = generateAmazonAffiliateLink(idee.produkt);
      const regex = new RegExp(`<${escapedProdukt}>`, "gi");
      const anchor = `<a href="${affiliateLink}" target="_blank" rel="noopener noreferrer">${idee.produkt}</a>`;
      blogHtml = blogHtml.replace(regex, anchor);
    }
    
    res.status(200).json({ blogContent: blogHtml });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}

const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { anlass, alter, beruf, hobby, stil, budget } = req.body;
  const geminiKey = process.env.GOOGLE_API_KEY;
  const affiliateTag = process.env.AFFILIATE_ID_AMAZON || "";
  const textPrompt = `Erstelle einen hochwertigen, SEO-optimierten und HTML-formatierten Blogartikel (mindestens 500 Wörter) über Geschenkideen. Nutze eine fesselnde H1-Überschrift. Integriere 10 gängige, auf Amazon auffindbare Geschenkideen als reine HTML-Liste (<ul><li>Geschenk 1</li>...</ul>), ohne Links. Gib NUR den HTML-Code zurück. Kriterien: Anlass: ${anlass}, Zielperson: ca. ${alter}J, ${beruf}, Hobbies: ${hobby}, Stil: ${stil}, Budget: ${budget}.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: textPrompt }] }] })
    });
    if (!response.ok) throw new Error("Text-Generierung fehlgeschlagen");
    const data = await response.json();
    let blogHtml = data.candidates[0].content.parts[0].text.replace(/^```html\s*/, '').replace(/```$/, '').trim();
    const finalHtml = blogHtml.replace(/<li>(.*?)<\/li>/g, (match, content) => {
        const encodedQuery = encodeURIComponent(content.trim());
        const amazonUrl = affiliateTag ? `https://www.amazon.de/s?k=${encodedQuery}&tag=${affiliateTag}` : `https://www.amazon.de/s?k=${encodedQuery}`;
        return `<li><a href="${amazonUrl}" target="_blank" rel="noopener noreferrer">${content}</a></li>`;
    });
    res.status(200).json({ blogContent: finalHtml });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}

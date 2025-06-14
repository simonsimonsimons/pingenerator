// api/suggest.js
const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const geminiKey = process.env.GOOGLE_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash";
  const { anlass, alter, beruf, hobby, stil, budget } = req.body;

  const textPrompt = `
    Erstelle einen hochwertigen, HTML-formatierten Blogartikel (ca. 400-600 Wörter) über Geschenkideen.
    - Der Artikel soll eine einladende H1-Überschrift haben.
    - Integriere 10 gängige, auf Amazon auffindbare Geschenkideen als HTML-Liste (ul/li).
    - Gib NUR den HTML-Code zurück, ohne Markdown oder andere Formatierungen.
    Kriterien: Anlass: ${anlass}, Zielperson: ca. ${alter} Jahre, ${beruf}, Hobbies: ${hobby}, Stil: ${stil}, Budget: ${budget}.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: textPrompt }] }] })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error("Text-Generierung fehlgeschlagen");
    }
    
    const data = await response.json();
    let blogHtml = data.candidates[0].content.parts[0].text.replace(/^```html\s*/, '').replace(/```$/, '').trim();
    
    res.status(200).json({ blogContent: blogHtml });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}

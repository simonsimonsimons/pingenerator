// api/suggest.js
const fetch = require('node-fetch');

export default async function handler(req, res) {
  // ... (Code zum Generieren des Blog-HTML-Textes, basierend auf dem Prompt)
  // Gibt am Ende nur den HTML-Text zurück, ohne Bild.
  // Dieser Code ist eine vereinfachte Version von Ihrem alten `generate-content.js`
  const geminiKey = process.env.GOOGLE_API_KEY;
  const { anlass, ...otherData } = req.body;
  const textPrompt = `Erstelle einen hochwertigen, HTML-formatierten Blogartikel über Geschenkideen für den Anlass: ${anlass}...`; // Ihr vollständiger Prompt hier

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: textPrompt }] }] })
    });
    if (!response.ok) throw new Error("Text-Generierung fehlgeschlagen");
    
    const data = await response.json();
    let blogHtml = data.candidates[0].content.parts[0].text.replace(/^```html\s*/, '').replace(/```$/, '').trim();
    
    res.status(200).json({ blogContent: blogHtml });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}

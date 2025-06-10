const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { topic, style, model } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: 'API-Schlüssel für Gemini nicht konfiguriert.' });
  }

  const stylePrompts = {
    professional: 'Erstelle einen professionellen, sachlichen Blogpost mit klarer Struktur und fundierten Informationen.',
    casual: 'Schreibe einen lockeren, persönlichen Blogpost mit einer freundlichen, nahbaren Sprache.',
    expert: 'Verfasse einen detaillierten, fachlich fundierten Artikel mit tiefgreifenden Analysen und Expertenwissen.',
    beginner: 'Erstelle einen einfach verständlichen Blogpost, der auch für Einsteiger leicht zu verstehen ist.'
  };

  const prompt = `${stylePrompts[style]}\n\nThema: "${topic}"\n\nDer Blogpost soll:\n- Einen SEO-optimierten Titel haben\n- Eine Einleitung mit Hook\n- 4-6 Abschnitte mit Zwischenüberschriften\n- Praktische Tipps enthalten\n- Listen für Lesbarkeit nutzen\n- Fazit mit Call-to-Action\n- 1000-1500 Wörter\nFormatiert mit HTML-Tags auf Deutsch.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
      })
    });
    const data = await response.json();

    if (!response.ok || !data.candidates) {
      console.error("Gemini API Error:", data);
      return res.status(500).json({ error: 'Fehler bei der Kommunikation mit der Gemini API.' });
    }
    
    const blogContent = data.candidates[0].content.parts[0].text;
    res.status(200).json({ blogContent: blogContent });
  
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler bei der Blog-Generierung.' });
  }
}
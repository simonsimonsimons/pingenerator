const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

// --- Authentifizierungs-Funktion für Imagen (Vertex AI) ---
async function getGcpAccessToken() {
  const credentialsJsonString = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!credentialsJsonString) throw new Error('GOOGLE_CREDENTIALS_JSON ist nicht konfiguriert.');
  
  const credentials = JSON.parse(credentialsJsonString);
  const auth = new GoogleAuth({
    credentials,
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

// --- Haupt-Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const geminiKey = process.env.GOOGLE_API_KEY;
  const projectId = process.env.GCP_PROJECT_ID;
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
    // === SCHRITT 1: Text mit Gemini generieren ===
    const textGenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: textPrompt }] }] })
    });
    if (!textGenResponse.ok) throw new Error('Fehler bei der Text-Generierung.');
    const textData = await textGenResponse.json();
    let blogHtml = textData.candidates[0].content.parts[0].text.replace(/^```html\s*/, '').replace(/```$/, '').trim();
    
    const titleMatch = blogHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1] : 'Spannende Geschenkideen';

    // === SCHRITT 2: Bild mit Imagen generieren (mit neuem Prompt) ===
    const dynamicTextOverlay = `Die besten Geschenke für: ${anlass || 'besondere Anlässe'}`;
    
    // NEUER, AUF LESBARKEIT OPTIMIERTER PROMPT
    const imagePrompt = `
      Ein klickstarkes Pinterest-Thumbnail im Stil eines professionellen Grafikdesigns.
      Fokus: Perfekt lesbarer Text.
      Text-Inhalt: "${dynamicTextOverlay}"
      Text-Stil: Große, fette, weiße Sans-Serif-Schrift. Hoher Kontrast zum Hintergrund. Die Typografie muss sauber, scharf und klar lesbar sein. Der Text ist das wichtigste Element.
      Hintergrund: Ein einfacher, moderner Hintergrund mit sanften, warmen Pastellfarben, der zum Thema "${title}" passt. Der Hintergrund sollte minimalistisch sein und den Text nicht stören.
    `;
    
    const accessToken = await getGcpAccessToken();
    const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;
    
    const imageGenResponse = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [{ prompt: imagePrompt }],
            parameters: { sampleCount: 1 }
        })
    });
    
    if (!imageGenResponse.ok) {
      const errorText = await imageGenResponse.text();
      console.error("❌ Imagen API Fehler-Details:", errorText);
      throw new Error('Fehler bei der Bild-Generierung.');
    }

    const imageData = await imageGenResponse.json();
    const base64Image = imageData.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${base64Image}`;

    // === SCHRITT 3: Bild in HTML einfügen ===
    const imageTag = `<img src="${imageUrl}" alt="${title}" style="width:100%; height:auto; border-radius:8px; margin-bottom:1.5em;" />`;
    blogHtml = blogHtml.replace(/(<h1[^>]*>.*?<\/h1>)/i, `$1${imageTag}`);

    res.status(200).json({ blogContent: blogHtml });

  } catch (err) {
    console.error("Fehler in generate-content:", err.message);
    res.status(500).json({ error: 'Fehler bei der Content-Erstellung.' });
  }
}

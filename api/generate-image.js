const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, anlass } = req.body;
  const projectId = process.env.GCP_PROJECT_ID;

  if (!title || !anlass || !projectId) {
    return res.status(400).json({ error: 'Fehlende Parameter.' });
  }

  const textOverlay = `Die besten Geschenkideen für: ${anlass}`;
  const imagePrompt = `
    Ein klickstarkes Pinterest-Thumbnail im Stil eines professionellen Grafikdesigns.
    Fokus: Perfekt lesbarer Text.
    Text-Inhalt: "${textOverlay}"
    Text-Stil: Große, fette, weiße Sans-Serif-Schrift. Hoher Kontrast zum Hintergrund. Die Typografie muss sauber, scharf und klar lesbar sein.
    Hintergrund: Ein einfacher, moderner Hintergrund mit sanften Pastellfarben, der zum Thema "${title}" passt und nicht vom Text ablenkt.
  `;

  try {
    const accessToken = await getGcpAccessToken();
    const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;
    
    const apiRes = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [{ prompt: imagePrompt }],
            parameters: { sampleCount: 1 }
        })
    });
    
    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error("❌ Imagen API Fehler:", errorText);
      throw new Error('Fehler bei der Bild-Generierung.');
    }

    const imageData = await apiRes.json();
    if (!imageData.predictions || imageData.predictions.length === 0) throw new Error("Imagen API hat kein Bild zurückgegeben.");
    
    const base64Image = imageData.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    res.status(200).json({ imageUrl });

  } catch(err) {
    console.error("Fehler in generate-image:", err.message);
    res.status(500).json({ error: 'Interner Serverfehler bei Bildgenerierung.' });
  }
}

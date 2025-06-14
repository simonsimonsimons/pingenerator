// api/generate-image.js
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

  const { prompt } = req.body;
  const projectId = process.env.GCP_PROJECT_ID;

  if (!prompt || !projectId) {
    return res.status(400).json({ error: 'Fehlende Parameter: prompt oder GCP_PROJECT_ID' });
  }

  const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;

  try {
    const accessToken = await getGcpAccessToken();

    const apiRes = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{ prompt: `Ein ansprechendes Pinterest-Thumbnail für einen Blogartikel. Das Bild soll prominent den Text "${prompt}" enthalten. Moderner, ästhetischer Stil mit sanften Pastellfarben.` }],
        parameters: { sampleCount: 1 }
      })
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error("Imagen API Fehler:", errorText);
      throw new Error(`Imagen API Fehler`);
    }

    const data = await apiRes.json();
    const base64Image = data.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    res.status(200).json({ imageUrl });

  } catch(err) {
    console.error("Fehler in generate-image:", err.message);
    res.status(500).json({ error: 'Interner Serverfehler bei der Bildgenerierung.' });
  }
}

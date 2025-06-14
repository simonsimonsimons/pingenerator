// api/generate-image.js (Robuste Version mit besserem Logging)
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
        instances: [{ prompt }],
        parameters: { sampleCount: 1 }
      })
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error("❌ Imagen API hat einen Fehler zurückgegeben:", errorText);
      throw new Error(`Imagen API Fehler`);
    }

    const data = await apiRes.json();
    
    // NEU: Detailliertes Logging und robuste Überprüfung
    console.log("Vollständige Antwort von der Imagen API:", JSON.stringify(data, null, 2));

    if (!data.predictions || !Array.isArray(data.predictions) || data.predictions.length === 0) {
      console.error("❌ Imagen API hat keine Bilder (predictions) zurückgegeben.");
      // Prüfen, ob ein Sicherheitsgrund angegeben wurde
      if (data.error) {
        throw new Error(`Die Bild-API hat einen Fehler gemeldet: ${data.error.message}`);
      }
      throw new Error("Die Bild-API hat kein gültiges Bild zurückgegeben.");
    }

    const base64Image = data.predictions[0].bytesBase64Encoded;
    if (!base64Image) {
        throw new Error("Das zurückgegebene Bild-Objekt enthält keine Base64-Daten.");
    }
    
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    res.status(200).json({ imageUrl });

  } catch(err) {
    console.error("Fehler in generate-image:", err.message);
    res.status(500).json({ error: 'Interner Serverfehler bei der Bildgenerierung.' });
  }
}

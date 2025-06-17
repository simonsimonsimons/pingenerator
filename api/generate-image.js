// /api/generate-image.js
import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';
import Jimp from 'jimp';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Schritt 1: Auth für Vertex AI
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!credentialsJson) return res.status(500).json({ error: "Missing Google Service Account Credentials" });

    const credentials = JSON.parse(credentialsJson);

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const accessToken = await auth.getAccessToken();

    // Schritt 2: Prompt auslesen
    const { title, anlass } = req.body;
    if (!title || !anlass) return res.status(400).json({ error: 'title and anlass required' });

    const imagePrompt = `Erstelle ein hochwertiges, pastelliges Hintergrundbild zum Anlass "${anlass}". Kein Text.`;

    // Schritt 3: Anfrage an Vertex AI (Imagen API)
    const projectId = credentials.project_id;
    const location = 'us-central1'; // ggf. anpassen
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration:predict`;

    const vertexResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{
          prompt: imagePrompt,
          // Optional: Größe und ggf. weitere Parameter anpassen
        }]
      })
    });

    if (!vertexResponse.ok) {
      const errText = await vertexResponse.text();
      return res.status(500).json({ error: `Vertex AI Error: ${errText}` });
    }

    const vertexData = await vertexResponse.json();
    const base64Image = vertexData?.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) return res.status(500).json({ error: "No image data returned" });

    // Schritt 4: Overlay-Text mit jimp
    const image = await Jimp.read(Buffer.from(base64Image, 'base64'));
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Oder eigene Fontdatei
    image.print(font, 20, 20, title, image.bitmap.width - 40);

    // Schritt 5: Ergebnis als base64 zurück an Frontend
    const outBase64 = await image.getBase64Async(Jimp.MIME_PNG);
    res.status(200).json({ image: outBase64 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server Error' });
  }
}

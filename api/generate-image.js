const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const Jimp = require('jimp');
const path = require('path');

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

  const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;

  try {
    const accessToken = await getGcpAccessToken();
    
    const imagePrompt = `Ein ästhetischer, minimalistischer Hintergrund für eine Pinterest-Grafik zum Thema "${title}". Sanfte, helle Pastellfarben. Sauber und hochwertig, mit viel freiem Platz in der Mitte für Text. Kein Text.`;
    
    const imageGenResponse = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [{ prompt: imagePrompt }],
            parameters: { sampleCount: 1 }
        })
    });

    if (!imageGenResponse.ok) throw new Error('Hintergrundbild-Generierung fehlgeschlagen.');
    const imageData = await imageGenResponse.json();
    if (!imageData.predictions) throw new Error("Imagen API hat kein Bild zurückgegeben.");
    
    const base64Image = imageData.predictions[0].bytesBase64Encoded;
    const imageBuffer = Buffer.from(base64Image, 'base64');

    const image = await Jimp.read(imageBuffer);
    
    // Dieser Pfad ist jetzt dank vercel.json auf dem Server verfügbar
    const fontPath = path.join(process.cwd(), 'fonts', 'open-sans-64-black.fnt');
    const font = await Jimp.loadFont(fontPath);
    
    const text = `Top 10 Geschenke für:\n${anlass}`;
    
    image.print(
      font, 
      0, 0,
      {
        text: text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      },
      image.bitmap.width,
      image.bitmap.height
    );

    const finalImageBase64 = await image.getBase64Async(Jimp.MIME_PNG);
    res.status(200).json({ imageUrl: finalImageBase64 });

  } catch (err) {
    console.error("Fehler in generate-image:", err.message);
    res.status(500).json({ error: 'Interner Serverfehler bei Bild-Erstellung.' });
  }
}
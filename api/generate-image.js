const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const Jimp = require('jimp');
const path = require('path'); // Node.js-Modul für die Pfad-Verarbeitung

// --- Authentifizierungs-Funktion (unverändert) ---
async function getGcpAccessToken() {
  // ... (Ihre Funktion bleibt hier unverändert)
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

  try {
    const accessToken = await getGcpAccessToken();
    
    // --- Schritt A: Hintergrundbild generieren (unverändert) ---
    const imagePrompt = `Ein ästhetischer, minimalistischer Hintergrund für eine Pinterest-Grafik zum Thema "${title}". Sanfte, moderne Pastellfarben. Sauber und hochwertig, mit viel freiem Platz in der Mitte für Text. Kein Text.`;
    // ... (Ihr fetch-Aufruf an die Imagen API bleibt hier unverändert) ...
    const imageData = await imageGenResponse.json();
    const imageBuffer = Buffer.from(imageData.predictions[0].bytesBase64Encoded, 'base64');

    // --- Schritt B: Text mit Jimp auf das Bild schreiben (geändert) ---
    const image = await Jimp.read(imageBuffer);
    
    // NEU: Lädt die Schriftart aus unserem lokalen Projekt-Ordner
    const fontPath = path.join(process.cwd(), 'fonts', 'open-sans-64-white.fnt');
    const font = await Jimp.loadFont(fontPath);
    
    const text = `Top 10 Geschenke für:\n${anlass}`;
    image.print(
      font, 
      0, // x
      0, // y
      {
        text: text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      },
      image.bitmap.width,  // max-Breite
      image.bitmap.height // max-Höhe
    );

    const finalImageBase64 = await image.getBase64Async(Jimp.MIME_PNG);
    res.status(200).json({ imageUrl: finalImageBase64 });

  } catch (err) {
    console.error("Fehler in generate-image:", err.message);
    res.status(500).json({ error: 'Interner Serverfehler bei Bild-Erstellung.' });
  }
}

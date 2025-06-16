import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';

// ... (getGcpAccessToken Funktion bleibt unverändert)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, anlass } = req.body;
  const projectId = process.env.GCP_PROJECT_ID;
  if (!title || !anlass || !projectId) {
    return res.status(400).json({ error: 'Fehlende Parameter.' });
  }

  let browser = null;
  try {
    const accessToken = await getGcpAccessToken();
    const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;
    const imagePrompt = `Ein ästhetischer, minimalistischer Hintergrund für eine Pinterest-Grafik zum Thema "${title}". Sanfte, helle Pastellfarben. Sauber, hochwertig, mit viel freiem Platz in der Mitte für Text. Kein Text.`;
    
    // --- Schritt A: Hintergrundbild von Imagen holen ---
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
    const backgroundImageUri = `data:image/png;base64,${base64Image}`;

    // --- Schritt B: Text mit Puppeteer auf das Bild rendern ---
    const textOverlay = `Top 10 Geschenke für ${anlass}`;

    // HTML-Vorlage für das Bild
    const htmlContent = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; width: 800px; height: 1200px; }
            .container {
              width: 100%; height: 100%;
              display: flex; justify-content: center; align-items: center;
              text-align: center;
              background-image: url(${backgroundImageUri});
              background-size: cover;
              background-position: center;
            }
            h1 {
              font-family: 'Montserrat', sans-serif;
              font-size: 80px;
              font-weight: 700;
              color: white;
              padding: 0 40px;
              text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${textOverlay}</h1>
          </div>
        </body>
      </html>
    `;

    // Puppeteer konfigurieren und starten
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 800, height: 1200 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const screenshotBuffer = await page.screenshot({ type: 'png', encoding: 'base64' });
    const finalImageUrl = `data:image/png;base64,${screenshotBuffer}`;

    res.status(200).json({ imageUrl: finalImageUrl });

  } catch (error) {
    console.error("Fehler in generate-image (Puppeteer):", error);
    return res.status(500).json({ error: 'Interner Fehler bei der Bild-Erstellung.' });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

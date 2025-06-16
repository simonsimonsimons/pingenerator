const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const handler = async (req, res) => {
  const { query } = req;
  const { text, color, bgColor, fontSize, width, height } = query;

  try {
    // 1. Lade die lokale Schriftart-Datei
    // process.cwd() ist das Stammverzeichnis deines Projekts auf Vercel
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
    const fontData = fs.readFileSync(fontPath);
    // Konvertiere die Schriftart in Base64, um sie direkt ins CSS einzubetten
    const base64Font = fontData.toString('base64');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: parseInt(width) || 1200, height: parseInt(height) || 630 });

    // 2. Erstelle das HTML und bette die Schriftart via @font-face direkt ein
    const html = `
      <html>
        <head>
          <style>
            /* Definiere eine eigene Schriftfamilie und lade die Base64-codierte
              Schriftart direkt. Das ist extrem schnell und zuverlässig.
            */
            @font-face {
              font-family: 'Roboto Custom';
              src: url(data:font/truetype;charset=utf-8;base64,${base64Font}) format('truetype');
              font-weight: 700;
              font-style: normal;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              margin: 0;
              background-color: #${bgColor || 'ffffff'};
              /* Verwende die oben definierte, lokal geladene Schriftart */
              font-family: 'Roboto Custom', sans-serif;
            }
            .text-container {
              font-size: ${fontSize || '72'}px;
              color: #${color || '000000'};
              text-align: center;
              padding: 20px;
              /* Zeilenumbruch bei langen Texten hinzufügen */
              word-wrap: break-word;
              max-width: 90%;
            }
          </style>
        </head>
        <body>
          <div class="text-container">${text || 'Hello World'}</div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const imageBuffer = await page.screenshot({ type: 'png' });

    await browser.close();

    // 3. Sende das generierte Bild als Antwort
    res.setHeader('Content-Type', 'image/png');
    // Setze einen starken Caching-Header, damit das Bild bei gleichen Parametern nicht neu generiert werden muss
    res.setHeader('Cache-Control', 's-maxage=31536000, stale-while-revalidate');
    res.status(200).send(imageBuffer);

  } catch (error) {
    console.error('Fehler in generate-image:', error);
    res.status(500).json({ error: 'Fehler beim Generieren des Bildes.', details: error.message });
  }
};

module.exports = handler;
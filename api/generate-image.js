const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const path = require('path');
const fs = require('fs');

const handler = async (req, res) => {
  const { query } = req;
  const { text, color, bgColor, fontSize, width, height } = query;

  try {
    // Lade die lokale Schriftart-Datei
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
    const fontData = fs.readFileSync(fontPath);
    const base64Font = fontData.toString('base64');

    // Starte den Browser mit den für Vercel optimierten Einstellungen
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: parseInt(width) || 1200, height: parseInt(height) || 630 });

    const html = `
      <html>
        <head>
          <style>
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
              font-family: 'Roboto Custom', sans-serif;
            }
            .text-container {
              font-size: ${fontSize || '72'}px;
              color: #${color || '000000'};
              text-align: center;
              padding: 20px;
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

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 's-maxage=31536000, stale-while-revalidate');
    res.status(200).send(imageBuffer);

  } catch (error) {
    console.error('Fehler in generate-image:', error);
    res.status(500).json({ error: 'Fehler beim Generieren des Bildes.', details: error.message });
  }
};

module.exports = handler;
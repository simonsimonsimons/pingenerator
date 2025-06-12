const fetch = require('node-fetch');

// Diese Funktion holt sich mit dem Refresh Token einen neuen Access Token von Google
async function getAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.BLOGGER_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Fehler beim Abrufen des Access Tokens:", errorData);
    throw new Error('Konnte keinen gültigen Access Token abrufen. Bitte Refresh Token und Client-Daten prüfen.');
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}


// Die Hauptfunktion, die den Post erstellt
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, content } = req.body;
  const blogId = process.env.BLOGGER_BLOG_ID;

  if (!blogId) {
    return res.status(500).json({ error: 'Blogger Blog ID ist auf dem Server nicht konfiguriert.' });
  }
  if (!title || !content) {
    return res.status(400).json({ error: 'Titel oder Inhalt für den Post fehlen.' });
  }
  
  try {
    // Schritt 1: Einen frischen, gültigen Access Token anfordern
    const accessToken = await getAccessToken();

    const url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`;
    
    // Schritt 2: Den Blogpost mit dem neuen Access Token veröffentlichen
    const postResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Den neuen, gültigen Token verwenden
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kind: 'blogger#post',
        title: title,
        content: content
      })
    });

    if (!postResponse.ok) {
      const errorData = await postResponse.json();
      console.error("Blogger API Fehler:", errorData);
      // Geben Sie eine spezifischere Fehlermeldung an das Frontend zurück
      throw new Error(`Blogger API Fehler: ${errorData.error.message}`);
    }

    const data = await postResponse.json();
    return res.status(200).json({ success: true, postUrl: data.url });

  } catch (err) {
    console.error("Fehler in der post-to-blogger Funktion:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

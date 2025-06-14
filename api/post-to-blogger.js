const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Empfängt jetzt den authCode vom Frontend
  const { title, content, authCode } = req.body;
  
  const blogId = process.env.BLOGGER_BLOG_ID;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!authCode) {
    return res.status(400).json({ error: 'Authorization Code fehlt.' });
  }
  if (!clientId || !clientSecret || !blogId) {
    return res.status(500).json({ error: 'Server-Konfiguration unvollständig.' });
  }

  try {
    // Schritt 1: Tausche den einmaligen Authorization Code gegen einen Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: authCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'postmessage', // Spezieller Wert für den JavaScript-Flow
        grant_type: 'authorization_code'
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Fehler beim Tausch des Auth-Codes:", errorData);
      throw new Error('Ungültiger Authorization Code. Bitte neu anmelden.');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Schritt 2: Poste den Artikel mit dem frisch erhaltenen Access Token
    const postResponse = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content, kind: 'blogger#post' })
    });

    if (!postResponse.ok) {
      const errorData = await postResponse.json();
      throw new Error(`Blogger API Fehler: ${errorData.error.message}`);
    }

    const data = await postResponse.json();
    return res.status(200).json({ success: true, postUrl: data.url });

  } catch (err) {
    console.error("Fehler in post-to-blogger:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

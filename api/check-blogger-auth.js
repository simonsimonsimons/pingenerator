// api/check-blogger-auth.js
const fetch = require('node-fetch');

// Exakt die gleiche Funktion wie in Ihrer post-to-blogger.js
async function getAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.BLOGGER_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Dieser Log ist entscheidend, wenn das Holen des Tokens fehlschlägt
    console.error("❌ Fehler beim Abrufen des Access Tokens:", errorData);
    throw new Error('Konnte keinen gültigen Access Token abrufen.');
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

export default async function handler(req, res) {
  try {
    console.log("▶️ Starte Authentifizierungs-Check...");
    const accessToken = await getAccessToken();
    console.log("✅ Erfolgreich einen Access Token erhalten!");
    
    // Wir versuchen jetzt eine einfache Lese-Anfrage an die Blogger-API
    const blogId = process.env.BLOGGER_BLOG_ID;
    const url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}?fetchUserInfo=true`;
    
    console.log("▶️ Sende Test-Anfrage an Blogger API...");
    const bloggerResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const bloggerData = await bloggerResponse.json();

    if (!bloggerResponse.ok) {
      console.error("❌ Blogger API hat den Token abgelehnt:", bloggerData);
      throw new Error('Der Access Token wurde von der Blogger API abgelehnt.');
    }

    console.log("✅ Authentifizierung bei Blogger erfolgreich! Blog-Name:", bloggerData.name);
    return res.status(200).json({ success: true, message: "Authentifizierung erfolgreich!", blogName: bloggerData.name });

  } catch (error) {
    console.error("❌ Gesamter Prozess fehlgeschlagen:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
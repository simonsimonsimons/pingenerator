const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

async function getGcpAccessToken() {
  try {
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
  } catch (err) {
    // Gibt den detaillierten Fehler von der Google-Bibliothek aus
    console.error("❌ Fehler in getGcpAccessToken:", err); 
    throw new Error('Could not refresh access token.');
  }
}

// Der Rest der Datei bleibt unverändert...
export default async function handler(req, res) {
  // ...
  try {
    const accessToken = await getGcpAccessToken();
    // ...
  } catch (err) {
    // ...
  }
}

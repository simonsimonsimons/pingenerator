// /api/post-to-blogger.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { html, title, blogId, authCode } = req.body;
    if (!html || !title || !blogId || !authCode)
      return res.status(400).json({ error: "html, title, blogId, authCode required" });

    // Google OAuth2 Setup
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost"; // In der Regel die Vercel-URL

    if (!clientId || !clientSecret)
      return res.status(500).json({ error: "Google Client ID/Secret missing" });

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // 1. Tausche Code gegen Token
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // 2. Blogger API-Client
    const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

    // 3. Post erstellen
    const bloggerResponse = await blogger.posts.insert({
      blogId,
      requestBody: {
        title,
        content: html,
      },
      isDraft: false
    });

    if (!bloggerResponse?.data?.url)
      return res.status(500).json({ error: "Publishing failed" });

    res.status(200).json({ url: bloggerResponse.data.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server Error' });
  }
}

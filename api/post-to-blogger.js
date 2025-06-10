const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, content } = req.body;
  const blogId = process.env.BLOGGER_BLOG_ID;
  const token = process.env.BLOGGER_OAUTH_TOKEN;

  if (!blogId || !token) {
    return res.status(500).json({ error: 'Blogger-Konfiguration auf dem Server fehlt.' });
  }
  if (!title || !content) {
    return res.status(400).json({ error: 'Titel oder Inhalt fehlen.' });
  }

  const url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kind: 'blogger#post',
        title: title,
        content: content
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Blogger API Error:", errorData);
      throw new Error(`Blogger API Fehler: ${errorData.error.message}`);
    }

    const data = await response.json();
    return res.status(200).json({ success: true, postUrl: data.url });

  } catch (err) {
    console.error("Fehler beim Posten auf Blogger:", err);
    return res.status(500).json({ error: err.message });
  }
}
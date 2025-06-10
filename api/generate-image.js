export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  
    const { topic } = req.body;
    
    // HINWEIS: Dies ist ein Platzhalter.
    const imageUrl = `https://via.placeholder.com/800x1200.png?text=Pinterest-Bild+fuer+${encodeURIComponent(topic)}`;
  
    await new Promise(resolve => setTimeout(resolve, 500)); // Simuliert Ladezeit
  
    res.status(200).json({ imageUrl: imageUrl });
  }
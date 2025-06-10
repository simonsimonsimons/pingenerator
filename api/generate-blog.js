import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Fehlender Parameter: topic' });
    }

    // Anfrage an die Gemini-API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Du bist ein hilfreicher Blog-Generator.' },
        { role: 'user', content: `Schreibe mir einen Blogartikel über: ${topic}` }
      ]
    });

    const blogContent = response.choices[0].message.content;

    // Affiliate-Link aus der Umgebung laden
    const affiliateLink = process.env.AFFILIATE_LINK;
    const affiliateHtml = affiliateLink
      ? `<p><a href=\"${affiliateLink}\" target=\"_blank\" rel=\"noopener noreferrer\">` +
        'Unterstütze uns mit einem Klick auf diesen Link</a></p>'
      : '';

    // Content mit Affiliate-Link zusammenfügen
    const resultContent = blogContent + affiliateHtml;

    return res.status(200).json({ blogContent: resultContent });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Serverfehler beim Generieren des Blogartikels' });
  }
}
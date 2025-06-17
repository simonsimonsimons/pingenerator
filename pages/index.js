import { useState } from 'react';

export default function HomePage() {
  const [text, setText] = useState('Hallo Welt!');
  const [imageUrl, setImageUrl] = useState('/api/generate-image?text=Hallo+Welt!');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ text });
    setImageUrl(`/api/generate-image?${params.toString()}`);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '50px' }}>
      <h1>Dynamischer Bildgenerator</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', minWidth: '300px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}>
          Bild generieren
        </button>
      </form>
      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px' }}>
        <h2>Generiertes Bild:</h2>
        {imageUrl && <img src={imageUrl} alt="Generated" style={{ maxWidth: '100%' }} />}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

// Helferfunktion, um den Titel aus dem HTML zu extrahieren
const extractTitle = (html) => {
  try {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1] : 'Unbenannter Beitrag';
  } catch (e) {
    return 'Unbenannter Beitrag';
  }
};

export default function App() {
  const [connectionOnline, setConnectionOnline] = useState(navigator.onLine);
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // ... (Online-Status unverändert) ...
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setCsvData(result.data);
          // Initialisiere den Ergebnis-Status für jede Zeile
          setResults(result.data.map(row => ({
            topic: row.anlass || 'Unbekannt',
            status: 'pending',
            message: 'Wartet...',
            postUrl: null
          })));
        }
      });
    }
  };

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    const newResults = [...results];

    for (let i = 0; i < csvData.length; i++) {
      const rowData = csvData[i];
      
      // 1. Status auf "Generierung" setzen
      newResults[i] = { ...newResults[i], status: 'processing', message: 'Blog wird generiert...' };
      setResults([...newResults]);

      try {
        // 2. Blogpost generieren
        const suggestRes = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rowData)
        });
        if (!suggestRes.ok) throw new Error('Blog-Generierung fehlgeschlagen');
        const suggestData = await suggestRes.json();
        const blogContent = suggestData.blog;
        const blogTitle = extractTitle(blogContent);

        // 3. Status auf "Posten" setzen
        newResults[i] = { ...newResults[i], message: 'Poste auf Blogger...' };
        setResults([...newResults]);

        // 4. Auf Blogger posten
        const bloggerRes = await fetch('/api/post-to-blogger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: blogTitle, content: blogContent })
        });
        if (!bloggerRes.ok) throw new Error('Blogger-Upload fehlgeschlagen');
        const bloggerData = await bloggerRes.json();

        // 5. Status auf "Erfolgreich" setzen
        newResults[i] = { ...newResults[i], status: 'success', message: 'Erfolgreich gepostet!', postUrl: bloggerData.postUrl };
        setResults([...newResults]);

      } catch (err) {
        console.error(`Fehler in Zeile ${i + 1}:`, err);
        newResults[i] = { ...newResults[i], status: 'error', message: err.message };
        setResults([...newResults]);
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="container">
      <div className={`connection-status ${connectionOnline ? 'online' : 'offline'}`}>
        {connectionOnline ? '🟢 Online' : '🔴 Offline'}
      </div>
      <Header />
      <div className="main-content">
        <TopicSection 
          onFileChange={handleFileChange}
          onStart={handleStartProcessing}
          isProcessing={isProcessing}
          fileName={fileName}
        />
        <ResultsSection results={results} />
      </div>
    </div>
  );
}
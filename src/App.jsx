import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import StatusSection from './components/StatusSection';
import ResultsSection from './components/ResultsSection';

export default function App() {
  const [connectionOnline, setConnectionOnline] = useState(navigator.onLine);
  
  // Der State wird an die neuen Felder angepasst
  const [topicData, setTopicData] = useState({
    alter: "",
    beruf: "",
    hobby: "",
    anlass: "",
    stil: "",
    budget: ""
  });

  const [status, setStatus] = useState({});
  const [results, setResults] = useState({ blog: '', ideas: [] }); // results-State erweitert
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const update = () => setConnectionOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus({ blog: { state: 'loading', text: 'Blogpost & Ideen werden generiert...' } });
    setResults({ blog: '', ideas: [] });

    try {
      // Ruft den neuen Endpunkt auf
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData) // Sendet alle Daten
      });

      if (!res.ok) {
        throw new Error(`Fehler vom Server: ${res.status}`);
      }
      
      const data = await res.json();
      setResults({ blog: data.blog, ideas: data.ideas });
      setStatus({ blog: { state: 'success', text: 'Inhalte erfolgreich generiert!' } });

    } catch (err) {
      console.error(err);
      setStatus({ ...status, error: { state: 'error', text: err.message } });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container">
      <div className={`connection-status ${connectionOnline ? 'online' : 'offline'}`}>
        {connectionOnline ? '🟢 Online' : '🔴 Offline'}
      </div>
      <Header />
      <div className="main-content">
        {/* Die Komponenten bleiben gleich, übergeben aber den neuen State */}
        <TopicSection topicData={topicData} setTopicData={setTopicData} onGenerate={handleGenerate} isGenerating={isGenerating} />
        <StatusSection status={status} />
        <ResultsSection results={results} />
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SetupSection from './components/SetupSection';
import TopicSection from './components/TopicSection';
import StatusSection from './components/StatusSection';
import ResultsSection from './components/ResultsSection';

export default function App() {
  const [connectionOnline, setConnectionOnline] = useState(navigator.onLine);
  
  const [config, setConfig] = useState({
    geminiModel: 'gemini-pro',
  });

  const [topicData, setTopicData] = useState({ topic: '', style: 'professional' });
  const [status, setStatus] = useState({});
  const [results, setResults] = useState({ blog: '', image: '' });
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
    if (!topicData.topic) {
      setStatus({ validation: { state: 'error', text: 'Bitte ein Thema eingeben!' } });
      return;
    }
    
    setIsGenerating(true);
    setStatus({});
    setResults({ blog: '', image: '' });

    try {
      setStatus({ blog: { state: 'loading', text: 'Blogpost wird generiert...' } });
      const blogRes = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...topicData, model: config.geminiModel })
      });
      if (!blogRes.ok) throw new Error(`Blog-Generierung fehlgeschlagen.`);
      const blogData = await blogRes.json();
      setStatus(s => ({ ...s, blog: { state: 'success', text: 'Blogpost erstellt!' } }));

      setStatus(s => ({ ...s, image: { state: 'loading', text: 'Bild wird generiert...' } }));
      const imageRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicData.topic })
      });
      if (!imageRes.ok) throw new Error(`Bild-Generierung fehlgeschlagen.`);
      const imageData = await imageRes.json();
      
      setResults({ blog: blogData.blogContent, image: imageData.imageUrl });
      setStatus(s => ({ ...s, image: { state: 'success', text: 'Bild erstellt!' } }));

    } catch (err) {
      console.error(err);
      setStatus(s => ({ ...s, error: { state: 'error', text: err.message } }));
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
        <SetupSection config={config} setConfig={setConfig} />
        <TopicSection topicData={topicData} setTopicData={setTopicData} onGenerate={handleGenerate} isGenerating={isGenerating} />
        <StatusSection status={status} />
        <ResultsSection results={results} />
      </div>
    </div>
  );
}
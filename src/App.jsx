import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

const extractTitle = (html) => { /* ... (unverändert) ... */ };

export default function App() {
  // --- States (vereinfacht) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [googleClient, setGoogleClient] = useState(null);
  const [googleAuthCode, setGoogleAuthCode] = useState(null);
  
  const [inputMode, setInputMode] = useState('manual');
  const [manualData, setManualData] = useState({ anlass: "", alter: "", beruf: "", hobby: "", stil: "", budget: "" });
  const [dataToProcess, setDataToProcess] = useState([]);
  const [fileName, setFileName] = useState("");
  
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedPost, setStagedPost] = useState(null);

  // --- Login-Logik (unverändert) ---
  useEffect(() => { /* ... */ }, []);
  const handleGoogleLogin = () => { /* ... */ };

  // --- Daten- und Verarbeitungslogik (angepasst) ---
  const handleFileChange = (event) => { /* ... (unverändert) ... */ };

  const handleStartProcessing = () => {
    const data = (inputMode === 'manual') ? [manualData] : dataToProcess;
    if (data.length === 0) return;
    
    // Wir verarbeiten hier nur den ersten Eintrag für diesen Workflow
    const firstRow = data[0];
    setResults([{ topic: firstRow.anlass || firstRow.hobby, status: 'pending', message: 'Wartet...', postUrl: null }]);
    setIsProcessing(true);

    generateAndStagePost(firstRow);
  };
  
  const generateAndStagePost = async (rowData) => {
    setResults([{ ...results[0], status: 'processing', message: 'Text & Bild werden generiert...' }]);
    setStagedPost(null);

    try {
      // NUR EIN API-AUFRUF
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)
      });
      if (!res.ok) throw new Error('Content-Generierung fehlgeschlagen');
      const data = await res.json();

      setStagedPost({
        title: extractTitle(data.blogContent),
        content: data.blogContent
      });
      setResults([{ ...results[0], status: 'review', message: 'Wartet auf Freigabe...' }]);

    } catch (err) {
      setResults([{ ...results[0], status: 'error', message: err.message }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAndPost = async () => {
    if (!stagedPost || !googleAuthCode) return;

    setResults([{ ...results[0], status: 'processing', message: 'Poste auf Blogger...' }]);
    
    try {
      const bloggerRes = await fetch('/api/post-to-blogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: stagedPost.title, content: stagedPost.content, authCode: googleAuthCofde })
      });
      if (!bloggerRes.ok) throw new Error('Blogger-Upload fehlgeschlagen');
      const bloggerData = await bloggerRes.json();
      
      setResults([{ ...results[0], status: 'success', message: 'Erfolgreich gepostet!', postUrl: bloggerData.postUrl }]);
    } catch (err) {
      setResults([{ ...results[0], status: 'error', message: err.message }]);
    } finally {
      setStagedPost(null);
    }
  };

  const handleRegenerate = () => {
    const data = (inputMode === 'manual') ? manualData : dataToProcess[0];
    generateAndStagePost(data);
  };

  // --- Render-Methode ---
  return (
    <div className="container">
      {/* ... (Login und Header unverändert) ... */}
      <div className="main-content">
        {isLoggedIn && (
          <>
            <TopicSection 
              // ... (Props unverändert)
            />
            {isProcessing && !stagedPost && <div className="status-item loading"><div className="loading-spinner"></div><span className="status-text">Generiere Text & Bild, dies kann bis zu 60 Sekunden dauern...</span></div>}
            
            <ResultsSection 
              result={results[0]} // Wir übergeben nur das eine Ergebnis
              stagedPost={stagedPost}
              onApprove={handleApproveAndPost}
              onRegenerate={handleRegenerate}
            />
          </>
        )}
      </div>
    </div>
  );
}

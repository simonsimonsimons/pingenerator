// src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

// ... (extractTitle und initializeGoogleSignIn Funktionen bleiben unverändert)

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [googleClient, setGoogleClient] = useState(null);
  const [googleAuthCode, setGoogleAuthCode] = useState(null);
  
  const [manualData, setManualData] = useState({ anlass: "Vatertag", hobby: "Grillen" });
  
  const [status, setStatus] = useState({ message: "", type: "idle" }); // idle, processing, success, error
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [generatedText, setGeneratedText] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [postUrl, setPostUrl] = useState(null);

  // ... (useEffect für Google Login bleibt unverändert)

  const handleGenerateText = async () => {
    setIsProcessing(true);
    setStatus({ message: "Schritt 1: Text wird generiert...", type: 'processing' });
    setGeneratedText(null);
    setGeneratedImage(null);
    setPostUrl(null);
    
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualData)
      });
      if (!res.ok) throw new Error('Text-Generierung fehlgeschlagen');
      const data = await res.json();
      setGeneratedText(data.blogContent);
      setStatus({ message: "Text generiert. Bereit für den nächsten Schritt.", type: 'success' });
    } catch (err) {
      setStatus({ message: `Fehler: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedText) return;
    setIsProcessing(true);
    setStatus({ message: "Schritt 2: Bild wird generiert (kann bis zu 30s dauern)...", type: 'processing' });
    setGeneratedImage(null);

    const title = extractTitle(generatedText);
    const textForImage = `Top 10 Geschenke für ${manualData.anlass}`;
    const prompt = `Ein ansprechendes Pinterest-Thumbnail zum Thema "${title}". Das Bild soll den Text "${textForImage}" enthalten.`;

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error('Bild-Generierung fehlgeschlagen');
      const data = await res.json();
      setGeneratedImage(data.imageUrl); // KORREKTE ZUWEISUNG
      setStatus({ message: "Bild erfolgreich generiert. Bereit zum Posten.", type: 'success' });
    } catch (err) {
      setStatus({ message: `Fehler: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostToBlogger = async () => {
    if (!generatedText || !generatedImage || !googleAuthCode) {
        alert("Text, Bild und Google-Anmeldung werden zum Posten benötigt.");
        return;
    };
    setIsProcessing(true);
    setStatus({ message: "Schritt 3: Post wird auf Blogger veröffentlicht...", type: 'processing' });

    const title = extractTitle(generatedText);
    const imageTag = `<img src="${generatedImage}" alt="${title}" style="width:100%; height:auto; border-radius:8px;" />`;
    const finalContent = generatedText.replace(/(<h1[^>]*>.*?<\/h1>)/i, `$1${imageTag}`);
    
    try {
      const res = await fetch('/api/post-to-blogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: finalContent, authCode: googleAuthCode })
      });
      if (!res.ok) throw new Error('Blogger-Upload fehlgeschlagen');
      const data = await res.json();
      setPostUrl(data.postUrl);
      setStatus({ message: `Erfolgreich gepostet!`, type: 'success' });
    } catch (err) {
      setStatus({ message: `Fehler: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
       { /* ... Header und Login ... */ }
      {isLoggedIn && (
        <div className="main-content">
          <TopicSection 
            topicData={manualData} 
            setTopicData={setManualData} 
            onGenerateText={handleGenerateText} 
            isProcessing={isProcessing}
          />
          <ResultsSection
            statusMessage={status.message}
            statusType={status.type}
            generatedText={generatedText}
            generatedImage={generatedImage}
            onGenerateImage={handleGenerateImage}
            onPostToBlogger={handlePostToBlogger}
            isProcessing={isProcessing}
            postUrl={postUrl}
          />
        </div>
      )}
    </div>
  );
}

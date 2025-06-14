import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

// Helferfunktion, um den Titel aus dem HTML zu extrahieren
const extractTitle = (html) => {
  try {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1].trim() : 'Beitrag ohne Titel';
  } catch (e) {
    return 'Beitrag ohne Titel';
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [googleClient, setGoogleClient] = useState(null);
  
  const [manualData, setManualData] = useState({
    anlass: "Vatertag",
    alter: "45",
    beruf: "Papa, der alles hat",
    hobby: "Grillen & Entspannen",
    stil: "lustig und praktisch",
    budget: "bis 100 Euro"
  });
  
  const [status, setStatus] = useState({ message: "Bereit.", type: "idle" });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [generatedText, setGeneratedText] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [postUrl, setPostUrl] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const scope = 'https://www.googleapis.com/auth/blogger';
      if (!clientId) {
        console.error("Google Client ID für Frontend nicht gefunden.");
        return;
      }
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: scope,
        ux_mode: 'popup',
        callback: () => {}, // Callback wird dynamisch gesetzt
      });
      setGoogleClient(client);
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handleInitialLogin = () => {
    if (googleClient) {
      googleClient.callback = () => setIsLoggedIn(true);
      googleClient.requestCode();
    }
  };

  const resetAll = () => {
    setIsProcessing(false);
    setGeneratedText(null);
    setGeneratedImage(null);
    setPostUrl(null);
    setStatus({ message: "Bereit für die nächste Generierung.", type: "idle" });
  };

  const handleGenerateText = async () => {
    resetAll();
    setIsProcessing(true);
    setStatus({ message: "Schritt 1/3: SEO-Text wird generiert...", type: 'processing' });
    
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualData)
      });
      if (!res.ok) throw new Error('Text-Generierung fehlgeschlagen');
      const data = await res.json();
      setGeneratedText(data.blogContent);
      setStatus({ message: "Text generiert. Bereit für Schritt 2.", type: 'success' });
    } catch (err) {
      setStatus({ message: `Fehler: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedText) return;
    setIsProcessing(true);
    setStatus({ message: "Schritt 2/3: Bild wird generiert (dauert ca. 30s)...", type: 'processing' });
    
    try {
      const title = extractTitle(generatedText);
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, anlass: manualData.anlass })
      });
      if (!res.ok) throw new Error('Bild-Generierung fehlgeschlagen');
      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      setStatus({ message: "Bild erfolgreich generiert. Bereit zum Posten.", type: 'success' });
    } catch (err) {
      setStatus({ message: `Fehler: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostToBlogger = async () => {
    if (!generatedText || !generatedImage || !googleClient) return;
    
    googleClient.callback = async (response) => {
      const authCode = response.code;
      if (!authCode) {
        setStatus({ message: "Google-Authentifizierung abgebrochen.", type: 'error' });
        return;
      }
      
      setIsProcessing(true);
      setStatus({ message: "Schritt 3/3: Post wird auf Blogger veröffentlicht...", type: 'processing' });

      const title = extractTitle(generatedText);
      const imageTag = `<img src="${generatedImage}" alt="${title}" style="width:100%; height:auto; border-radius:8px; margin: 1em 0;" />`;
      const finalContent = generatedText.replace(/(<h1[^>]*>.*?<\/h1>)/i, `$1${imageTag}`);
      
      try {
        const res = await fetch('/api/post-to-blogger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: finalContent, authCode })
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
    googleClient.requestCode();
  };

  return (
    <div className="container">
      <Header />
      <div className="main-content">
        {!isLoggedIn ? (
          <div className="login-wrapper">
            <button onClick={handleInitialLogin} className="google-login-btn" disabled={!googleClient}>
              {googleClient ? "Mit Google anmelden, um zu starten" : "Lade Login..."}
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

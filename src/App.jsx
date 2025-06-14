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
  const [googleAuthCode, setGoogleAuthCode] = useState(null);
  
  const [manualData, setManualData] = useState({ anlass: "Geburtstag für einen Gärtner", beruf: "", hobby: "Gartenarbeit", stil: "praktisch", alter: "50", budget: "" });
  
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [generatedText, setGeneratedText] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [postUrl, setPostUrl] = useState(null);

  // Initialisiert den Google Sign-In Client
  useEffect(() => {
    // ... (Diese Funktion bleibt unverändert) ...
  }, []);

  const handleGoogleLogin = () => { /* ... */ };

  const handleGenerateText = async () => {
    setIsProcessing(true);
    setStatusMessage("Schritt 1: Text wird generiert...");
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
      setStatusMessage("Text generiert. Bereit für den nächsten Schritt.");
    } catch (err) {
      setStatusMessage(`Fehler: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedText) return;
    setIsProcessing(true);
    setStatusMessage("Schritt 2: Bild wird generiert (kann bis zu 30s dauern)...");
    setGeneratedImage(null);

    const title = extractTitle(generatedText);
    const textForImage = `Top 10 Geschenke für ${manualData.anlass}`;
    const prompt = `Ein ansprechendes Pinterest-Thumbnail für einen Blogartikel zum Thema "${title}". Das Bild soll prominent den Text "${textForImage}" enthalten.`;

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error('Bild-Generierung fehlgeschlagen');
      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      setStatusMessage("Bild erfolgreich generiert. Bereit zum Posten.");
    } catch (err) {
      setStatusMessage(`Fehler: ${err.message}`);
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
    setStatusMessage("Schritt 3: Post wird auf Blogger veröffentlicht...");

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
      setStatusMessage(`Erfolgreich gepostet!`);
    } catch (err) {
      setStatusMessage(`Fehler: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
       <Header />
       <div className="main-content">
        {!isLoggedIn ? (
          <div className="login-wrapper">
            <button onClick={handleGoogleLogin} className="google-login-btn" disabled={!googleClient}>
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
              statusMessage={statusMessage}
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

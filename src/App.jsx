import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';
import Papa from 'papaparse';

// HIER IST DIE FEHLENDE FUNKTION
const extractTitle = (html) => {
  try {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1].trim() : 'Beitrag ohne Titel';
  } catch (e) {
    return 'Beitrag ohne Titel';
  }
};

// Die Google-Login-Funktion bleibt unverändert
function initializeGoogleSignIn(clientId, scope, callback) {
  if (!window.google) {
    console.error("Google-Skript ist nicht bereit.");
    return null;
  }
  const client = window.google.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: scope,
    ux_mode: 'popup',
    callback: callback,
  });
  return client;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [googleClient, setGoogleClient] = useState(null);
  const [googleAuthCode, setGoogleAuthCode] = useState(null);
  
  const [manualData, setManualData] = useState({ anlass: "Vatertag", beruf: "Papa", hobby: "Grillen", stil: "lustig", alter: "45", budget: "50 Euro" });
  
  const [statusMessage, setStatusMessage] = useState("");
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
      if (!clientId) return;
      const client = initializeGoogleSignIn(clientId, scope, (response) => {
        setGoogleAuthCode(response.code);
        setIsLoggedIn(true);
      });
      setGoogleClient(client);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleLogin = () => {
    if (googleClient) googleClient.requestCode();
  };

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
    setStatusMessage("Schritt 2: Bild wird generiert...");
    setGeneratedImage(null);

    const title = extractTitle(generatedText);
    const textForImage = `Top 10 Geschenke für ${manualData.anlass}`;
    const prompt = `Ein ansprechendes Pinterest-Thumbnail zum Thema "<span class="math-inline">\{title\}"\. Das Bild soll den Text "</span>{textForImage}" enthalten.`;

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
      setStatusMessage(`Fehler

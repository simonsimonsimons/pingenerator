import React, { useState, useEffect, useRef } from 'react';
// ... (andere Imports)
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

// Helferfunktion für den Google Login
function initializeGoogleSignIn(clientId, scope, callback) {
  if (window.google) {
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: scope,
      ux_mode: 'popup',
      callback: callback,
    });
    return client;
  }
  return null;
}

// ... (extractTitle Funktion unverändert)

export default function App() {
  const [googleClient, setGoogleClient] = useState(null);
  const [googleAuthCode, setGoogleAuthCode] = useState(null); // Code von Google
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ... (alle anderen State-Variablen bleiben gleich)
  const [inputMode, setInputMode] = useState('manual');
  const [manualData, setManualData] = useState({ anlass: "", alter: "", beruf: "", hobby: "", stil: "", budget: "" });
  const [dataToProcess, setDataToProcess] = useState([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stagedPost, setStagedPost] = useState(null);

  const resultsRef = useRef(results);
  resultsRef.current = results;
  const dataToProcessRef = useRef(dataToProcess);
  dataToProcessRef.current = dataToProcess;

  // Initialisiert den Google Sign-In Client
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID; // Diesen Key müssen Sie noch anlegen
    if (!clientId) {
      console.error("Google Client ID nicht gefunden. Bitte in .env.development oder Vercel setzen.");
      return;
    }
    const scope = 'https://www.googleapis.com/auth/blogger';
    
    const client = initializeGoogleSignIn(clientId, scope, (response) => {
      console.log('Authorization Code erhalten:', response.code);
      setGoogleAuthCode(response.code);
      setIsLoggedIn(true);
    });
    setGoogleClient(client);
  }, []);

  const handleGoogleLogin = () => {
    if (googleClient) {
      googleClient.requestCode();
    }
  };
  
  // ... (handleFileChange, startProcessing, processRow unverändert) ...

  const handleApproveAndPost = async () => {
    if (!stagedPost || !googleAuthCode) {
      alert("Bitte zuerst bei Google anmelden, um zu posten.");
      return;
    }

    const { index, title, content } = stagedPost;
    let newResults = [...results];
    newResults[index] = { ...newResults[index], status: 'processing', message: 'Poste auf Blogger...' };
    setResults([...newResults]);
    setStagedPost(null);

    try {
      // Senden den Auth-Code an den neuen Backend-Endpunkt
      const bloggerRes = await fetch('/api/post-to-blogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, authCode: googleAuthCode })
      });
      if (!bloggerRes.ok) {
        const errorData = await bloggerRes.json();
        throw new Error(errorData.error || 'Blogger-Upload fehlgeschlagen');
      }
      const bloggerData = await bloggerRes.json();
      
      newResults = [...resultsRef.current];
      newResults[index] = { ...newResults[index], status: 'success', message: 'Erfolgreich gepostet!', postUrl: bloggerData.postUrl };
      setResults([...newResults]);
    } catch (err) {
      newResults = [...resultsRef.current];
      newResults[index] = { ...newResults[index], status: 'error', message: err.message };
      setResults([...newResults]);
    } finally {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // ... (handleRegenerate, handleDiscard unverändert) ...

  return (
    <div className="container">
      <Header />
      <div className="google-login-container">
        {isLoggedIn ? (
          <p className="login-status success">✅ Bei Google angemeldet</p>
        ) : (
          <button onClick={handleGoogleLogin} className="google-login-btn">
            Anmelden mit Google, um zu posten
          </button>
        )}
      </div>
      <div className="main-content">
        {/* ... (TopicSection und ResultsSection unverändert) ... */}
      </div>
    </div>
  );
}

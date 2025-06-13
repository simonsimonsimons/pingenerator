import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

// Helferfunktion für den Google Login
function initializeGoogleSignIn(clientId, scope, callback) {
  if (!window.google) { return null; }
  const client = window.google.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: scope,
    ux_mode: 'popup',
    callback: callback,
  });
  return client;
}

const extractTitle = (html) => {
  try {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1].trim() : 'Beitrag ohne Titel';
  } catch (e) {
    return 'Beitrag ohne Titel';
  }
};

export default function App() {
  const [googleClient, setGoogleClient] = useState(null);
  const [googleAuthCode, setGoogleAuthCode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [inputMode, setInputMode] = useState('manual');
  const [manualData, setManualData] = useState({ anlass: "", alter: "", beruf: "", hobby: "", stil: "", budget: "" });
  const [dataToProcess, setDataToProcess] = useState([]);
  
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null); // Nur noch ein Ergebnis-Objekt
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedPost, setStagedPost] = useState(null);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const scope = 'https://www.googleapis.com/auth/blogger';
    const client = initializeGoogleSignIn(clientId, scope, (response) => {
      setGoogleAuthCode(response.code);
      setIsLoggedIn(true);
    });
    setGoogleClient(client);
  }, []);

  const handleGoogleLogin = () => {
    if (googleClient) googleClient.requestCode();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => setDataToProcess(result.data)
      });
    }
  };

  const startProcessing = async () => {
    const data = (inputMode === 'manual') ? [manualData] : dataToProcess;
    if (data.length === 0) return;
    
    const rowData = data[0]; // Wir verarbeiten nur den ersten Eintrag
    setIsProcessing(true);
    setStagedPost(null);
    setResult({ topic: rowData.anlass || rowData.hobby, status: 'processing', message: 'Text & Bild werden generiert...' });

    try {
      const res = await fetch('/api/generate-content', { // Ruft den neuen Endpunkt auf
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)
      });
      if (!res.ok) throw new Error('Content-Generierung fehlgeschlagen');
      const contentData = await res.json();

      setStagedPost({
        title: extractTitle(contentData.blogContent),
        content: contentData.blogContent
      });
      setResult(prev => ({ ...prev, status: 'review', message: 'Wartet auf Freigabe...' }));

    } catch (err) {
      setResult(prev => ({ ...prev, status: 'error', message: err.message }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAndPost = async () => {
    if (!stagedPost || !googleAuthCode) return;

    setResult(prev => ({ ...prev, status: 'processing', message: 'Poste auf Blogger...' }));
    
    try {
      const bloggerRes = await fetch('/api/post-to-blogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: stagedPost.title, content: stagedPost.content, authCode: googleAuthCode })
      });
      if (!bloggerRes.ok) throw new Error('Blogger-Upload fehlgeschlagen');
      const bloggerData = await bloggerRes.json();
      
      setResult(prev => ({ ...prev, status: 'success', message: 'Erfolgreich gepostet!', postUrl: bloggerData.postUrl }));
    } catch (err) {
      setResult(prev => ({ ...prev, status: 'error', message: err.message }));
    } finally {
      setStagedPost(null);
    }
  };

  const handleRegenerate = () => {
    const data = (inputMode === 'manual') ? [manualData] : dataToProcess[0];
    startProcessing(data);
  };

  return (
    <div className="container">
      <Header />
      <div className="main-content">
        {!isLoggedIn ? (
          <div className="login-wrapper">
            <button onClick={handleGoogleLogin} className="google-login-btn">
              Mit Google anmelden, um zu starten
            </button>
          </div>
        ) : (
          <>
            <TopicSection 
              inputMode={inputMode} setInputMode={setInputMode}
              topicData={manualData} setTopicData={setManualData}
              onFileChange={handleFileChange} fileName={fileName}
              onStart={startProcessing} isProcessing={isProcessing}
            />
            <ResultsSection 
              result={result}
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

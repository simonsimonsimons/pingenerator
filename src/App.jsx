import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
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
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedPost, setStagedPost] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const resultsRef = useRef(results);
  resultsRef.current = results;
  const dataToProcessRef = useRef(dataToProcess);
  dataToProcessRef.current = dataToProcess;

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("Google Client ID nicht gefunden.");
      return;
    }
    const scope = 'https://www.googleapis.com/auth/blogger';
    
    const client = initializeGoogleSignIn(clientId, scope, (response) => {
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

  const startProcessing = () => {
    const data = (inputMode === 'manual') ? [manualData] : dataToProcess;
    if (data.length === 0) return;
    setDataToProcess(data);

    setResults(data.map(row => ({
      topic: row.anlass || row.hobby || 'Einzelner Beitrag',
      status: 'pending',
      message: 'Wartet...',
      postUrl: null
    })));
    setCurrentIndex(0);
    setIsProcessing(true);
  };
  
  const processRow = async (index) => {
    if (index >= dataToProcessRef.current.length) {
      setIsProcessing(false);
      return;
    }
    
    const rowData = dataToProcessRef.current[index];
    let newResults = [...resultsRef.current];
    newResults[index] = { ...newResults[index], status: 'processing', message: 'Blog wird generiert...' };
    setResults([...newResults]);

    try {
      const suggestRes = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)
      });
      if (!suggestRes.ok) throw new Error('Blog-Generierung fehlgeschlagen');
      const suggestData = await suggestRes.json();

      setStagedPost({
        index: index,
        title: extractTitle(suggestData.blog),
        content: suggestData.blog
      });
      
      newResults = [...resultsRef.current];
      newResults[index] = { ...newResults[index], status: 'review', message: 'Wartet auf Freigabe...' };
      setResults([...newResults]);

    } catch (err) {
      newResults = [...resultsRef.current];
      newResults[index] = { ...newResults[index], status: 'error', message: err.message };
      setResults([...newResults]);
      setCurrentIndex(index + 1); 
    }
  };

  useEffect(() => {
    if (isProcessing && !stagedPost) {
      processRow(currentIndex);
    }
  }, [isProcessing, currentIndex, stagedPost]);


  const handleApproveAndPost = async () => {
    if (!stagedPost || !googleAuthCode) {
      alert("Bitte zuerst bei Google anmelden.");
      return;
    }

    const { index, title, content } = stagedPost;
    let newResults = [...results];
    newResults[index] = { ...newResults[index], status: 'processing', message: 'Poste auf Blogger...' };
    setResults([...newResults]);
    setStagedPost(null);

    try {
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

  const handleRegenerate = () => {
    if (!stagedPost) return;
    const { index } = stagedPost;
    setStagedPost(null);
    processRow(index);
  };

  const handleDiscard = () => {
    if (!stagedPost) return;
    const { index } = stagedPost;
    
    let newResults = [...results];
    newResults[index] = { ...newResults[index], status: 'error', message: 'Manuell verworfen' };
    setResults(newResults);

    setStagedPost(null);
    setCurrentIndex(index + 1);
  }

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
              inputMode={inputMode}
              setInputMode={setInputMode}
              topicData={manualData}
              setTopicData={setManualData}
              onFileChange={handleFileChange}
              fileName={fileName}
              onStart={startProcessing}
              isProcessing={isProcessing}
            />
            <ResultsSection 
              results={results}
              stagedPost={stagedPost}
              onApprove={handleApproveAndPost}
              onRegenerate={handleRegenerate}
              onDiscard={handleDiscard}
            />
          </>
        )}
      </div>
    </div>
  );
}
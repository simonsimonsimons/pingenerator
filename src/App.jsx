import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

const extractTitle = (html) => {
  try {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1].trim() : 'Beitrag ohne Titel';
  } catch (e) {
    return 'Beitrag ohne Titel';
  }
};

export default function App() {
  const [inputMode, setInputMode] = useState('manual');
  const [manualData, setManualData] = useState({ anlass: "", alter: "", beruf: "", hobby: "", stil: "", budget: "" });
  const [dataToProcess, setDataToProcess] = useState([]);
  
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stagedPost, setStagedPost] = useState(null); // NEU: Für den Artikel, der auf Freigabe wartet

  const resultsRef = useRef(results);
  resultsRef.current = results;

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
    if (index >= dataToProcess.length) {
      setIsProcessing(false);
      return;
    }
    
    const rowData = dataToProcess[index];
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
      // Automatisch mit dem nächsten weitermachen, auch bei Fehler
      setCurrentIndex(index + 1); 
    }
  };

  useEffect(() => {
    if (isProcessing && !stagedPost) {
      processRow(currentIndex);
    }
  }, [isProcessing, currentIndex, stagedPost]);


  const handleApproveAndPost = async () => {
    if (!stagedPost) return;

    const { index, title, content } = stagedPost;
    let newResults = [...results];
    newResults[index] = { ...newResults[index], status: 'processing', message: 'Poste auf Blogger...' };
    setResults([...newResults]);
    setStagedPost(null); // Vorschau leeren

    try {
      const bloggerRes = await fetch('/api/post-to-blogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (!bloggerRes.ok) throw new Error('Blogger-Upload fehlgeschlagen');
      const bloggerData = await bloggerRes.json();
      
      newResults = [...resultsRef.current];
      newResults[index] = { ...newResults[index], status: 'success', message: 'Erfolgreich gepostet!', postUrl: bloggerData.postUrl };
      setResults([...newResults]);
    } catch (err) {
      newResults = [...resultsRef.current];
      newResults[index] = { ...newResults[index], status: 'error', message: err.message };
      setResults([...newResults]);
    } finally {
      // Nächsten Artikel in der Liste bearbeiten
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleRegenerate = () => {
    if (!stagedPost) return;
    const { index } = stagedPost;
    setStagedPost(null);
    processRow(index); // Den Generierungsprozess für den aktuellen Index neu starten
  };

  return (
    <div className="container">
      <Header />
      <div className="main-content">
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
          on
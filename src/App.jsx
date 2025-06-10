import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import Header from './components/Header';
import TopicSection from './components/TopicSection';
import ResultsSection from './components/ResultsSection';

const extractTitle = (html) => {
  try {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1] : 'Unbenannter Beitrag';
  } catch (e) {
    return 'Unbenannter Beitrag';
  }
};

export default function App() {
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'csv'
  const [manualData, setManualData] = useState({ anlass: "", hobby: "" });
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // useRef, um den State in der asynchronen Verarbeitung aktuell zu halten
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setCsvData(result.data);
          setResults(result.data.map(row => ({
            topic: row.anlass || 'Unbekannt',
            status: 'pending',
            message: 'Wartet...',
            postUrl: null
          })));
        }
      });
    }
  };

  const startProcessing = (dataToProcess) => {
    setResults(dataToProcess.map(row => ({
      topic: row.anlass || row.hobby || 'Einzel-Job',
      status: 'pending',
      message: 'Wartet...',
      postUrl: null
    })));
    setCurrentIndex(0);
    setIsPaused(false);
    setIsProcessing(true);
  };
  
  const handleStart = () => {
    if (inputMode === 'manual') {
      startProcessing([manualData]);
    } else {
      startProcessing(csvData);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    if (!isProcessing || isPausedRef.current) return;

    const processRow = async (index) => {
      if (index >= csvData.length && inputMode === 'csv' || index >= 1 && inputMode === 'manual') {
        setIsProcessing(false);
        return;
      }
      
      const data = (inputMode === 'manual') ? [manualData][index] : csvData[index];
      let newResults = [...resultsRef.current];

      try {
        newResults[index] = { ...newResults[index], status: 'processing', message: 'Blog wird generiert...' };
        setResults([...newResults]);

        const suggestRes = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!suggestRes.ok) throw new Error('Blog-Generierung fehlgeschlagen');
        const suggestData = await suggestRes.json();
        const blogContent = suggestData.blog;
        const blogTitle = extractTitle(blogContent);

        newResults = [...resultsRef.current];
        newResults[index] = { ...newResults[index], message: 'Poste auf Blogger...' };
        setResults([...newResults]);

        const bloggerRes = await fetch('/api/post-to-blogger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: blogTitle, content: blogContent })
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
        setCurrentIndex(index + 1);
      }
    };
    
    processRow(currentIndex);

  }, [isProcessing, currentIndex, inputMode, manualData, csvData]);


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
          onStart={handleStart}
          isProcessing={isProcessing}
        />
        {isProcessing && (
          <div className="controls">
            <button onClick={togglePause}>
              {isPaused ? '▶️ Weiter' : '⏸️ Pause'}
            </button>
          </div>
        )}
        <ResultsSection results={results} />
      </div>
    </div>
  );
}
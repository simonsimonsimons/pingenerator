// ... (alle Imports wie bisher)

export default function App() {
  // ... (alle States bis auf diese hier bleiben gleich)
  const [stagedPost, setStagedPost] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  // ... (alle Handler bis auf diesen hier bleiben gleich)

  // NEUE FUNKTION für die Bildgenerierung
  const handleGenerateImage = async () => {
    // Finde den zuletzt erfolgreich geposteten Blog-Eintrag
    const lastSuccess = results.find(r => r.status === 'success');
    if (!lastSuccess) {
      alert("Es gibt keinen erfolgreichen Blogpost, für den ein Bild generiert werden könnte.");
      return;
    }

    const prompt = lastSuccess.topic; 
    setIsGeneratingImage(true);
    
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Bildgenerierung fehlgeschlagen.');
      }
      const data = await res.json();
      setGeneratedImage(data.imageUrl);

    } catch (err) {
      alert(err.message); // Zeige Fehler im UI
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ... (restliche Logik wie handleApprove, etc.) ...

  return (
    <div className="container">
      {/* ... (Header und Login-Logik unverändert) ... */}
      <div className="main-content">
        {isLoggedIn ? (
          <>
            <TopicSection /* ... (unverändert) ... */ />
            <ResultsSection 
              results={results}
              stagedPost={stagedPost}
              onApprove={handleApproveAndPost}
              onRegenerate={handleRegenerate}
              onDiscard={handleDiscard}
              generatedImage={generatedImage}
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={isGeneratingImage}
            />
          </>
        ) : (
          <div className="login-wrapper">
            <button onClick={handleGoogleLogin} className="google-login-btn">
              Mit Google anmelden, um zu starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

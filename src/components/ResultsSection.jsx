import React from 'react';

export default function ResultsSection({ 
  results, 
  stagedPost, 
  onApprove, 
  onRegenerate, 
  onDiscard,
  // NEUE PROPS
  generatedImage,
  onGenerateImage,
  isGeneratingImage
}) {
  return (
    <div className="results-section">
      {/* Freigabe-Sektion für Blogpost */}
      {stagedPost && (
        <div className="review-card">
          <h3>Schritt 1: Blogpost-Freigabe</h3>
          <div className="blog-preview" dangerouslySetInnerHTML={{ __html: stagedPost.content }} />
          <div className="review-actions">
            <button className="approve-btn" onClick={onApprove}>✅ Freigeben & Posten</button>
            <button className="regenerate-btn" onClick={onRegenerate}>🔄 Erneut generieren</button>
            <button className="discard-btn" onClick={onDiscard}>❌ Verwerfen</button>
          </div>
        </div>
      )}

      {/* NEU: Sektion für Bild, erscheint wenn ein Post erfolgreich war */}
      {results.some(r => r.status === 'success') && !stagedPost && (
        <div className="review-card">
          <h3>Schritt 2: Bild für Pinterest generieren</h3>
          {!generatedImage ? (
            <button className="image-gen-btn" onClick={onGenerateImage} disabled={isGeneratingImage}>
              {isGeneratingImage ? 'Generiere Bild...' : '🎨 Bild jetzt generieren'}
            </button>
          ) : (
            <div className="pinterest-preview">
              <img src={generatedImage} alt="Generiertes Pinterest Bild" className="image-preview" />
            </div>
          )}
        </div>
      )}

      {/* Fortschrittstabelle */}
      {results.length > 0 && (
        <div className="progress-card">
          <h3>📋 Verarbeitungs-Protokoll</h3>
          <table className="results-table">
            {/* ... (Tabelle wie bisher) ... */}
          </table>
        </div>
      )}
    </div>
  );
}

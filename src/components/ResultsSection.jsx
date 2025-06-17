import React from 'react';

export default function ResultsSection({ 
  statusMessage, 
  statusType,
  generatedText, 
  generatedImage, 
  onGenerateImage, 
  onPostToBlogger,
  isProcessing,
  postUrl
}) {
  const showSection = generatedText || isProcessing || postUrl;
  if (!showSection) return null;

  const showGenerateImageButton = generatedText && !generatedImage && !isProcessing;
  const showPostToBloggerButton = generatedText && generatedImage && !postUrl && !isProcessing;

  return (
    <div className="results-section">
      <div className="progress-card">
        <h3>Fortschritt</h3>
        <p className={`status-message status-${statusType}`}>{statusMessage}</p>
        {postUrl && (
          <a href={postUrl} target="_blank" rel="noopener noreferrer" className="link-to-post">
            Zum veröffentlichten Post
          </a>
        )}
      </div>

      {generatedText && (
        <div className="review-card">
          <h4>Vorschau</h4>
          <div className="preview-container">
            {generatedImage && <img src={generatedImage} alt="Generiertes Bild" className="image-preview" />}
            <div className="blog-preview" dangerouslySetInnerHTML={{ __html: generatedText }} />
          </div>
          <div className="review-actions">
            {showGenerateImageButton && (
              <button onClick={onGenerateImage} disabled={isProcessing} className="image-gen-btn">
                Schritt 2: Passendes Bild generieren
              </button>
            )}
            {showPostToBloggerButton && (
              <button onClick={onPostToBlogger} disabled={isProcessing} className="approve-btn">
                Schritt 3: Auf Blogger posten
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

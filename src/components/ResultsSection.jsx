// src/components/ResultsSection.jsx
import React from 'react';

export default function ResultsSection({ 
  statusMessage, 
  generatedText, 
  generatedImage, 
  onGenerateImage, 
  onPostToBlogger,
  isProcessing,
  postUrl
}) {
  const showSection = statusMessage || generatedText;
  if (!showSection) return null;

  return (
    <div className="results-section">
      <div className="progress-card">
        <h3>Fortschritt</h3>
        <p className="status-message">{statusMessage}</p>
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
            {!generatedImage ? (
              <button onClick={onGenerateImage} disabled={isProcessing} className="image-gen-btn">
                2. Passendes Bild generieren
              </button>
            ) : (
              !postUrl && (
                <button onClick={onPostToBlogger} disabled={isProcessing} className="approve-btn">
                  3. Auf Blogger posten
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

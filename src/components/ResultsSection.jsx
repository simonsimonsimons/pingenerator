import React from 'react';

export default function ResultsSection({ result, stagedPost, onApprove, onRegenerate }) {

  return (
    <div className="results-section">
      {/* Zeigt den aktuellen Status an, wenn etwas in Bearbeitung ist */}
      {result && !stagedPost && (
        <div className={`status-item ${result.status}`}>
            <strong>Status:</strong> {result.message}
            {result.postUrl && <a href={result.postUrl} target="_blank" rel="noopener noreferrer" style={{marginLeft: '1rem'}}>Ansehen</a>}
        </div>
      )}

      {/* Zeigt die Vorschau an, wenn ein Artikel auf Freigabe wartet */}
      {stagedPost && (
        <div className="review-card">
          <h3>Vorschau & Freigabe</h3>
          <div className="blog-preview" dangerouslySetInnerHTML={{ __html: stagedPost.content }} />
          <div className="review-actions">
            <button className="approve-btn" onClick={onApprove}>✅ Freigeben & auf Blogger posten</button>
            <button className="regenerate-btn" onClick={onRegenerate}>🔄 Erneut generieren</button>
          </div>
        </div>
      )}
    </div>
  );
}

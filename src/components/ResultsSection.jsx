import React from 'react';

export default function ResultsSection({ result, stagedPost, onApprove, onRegenerate }) {

  if (!result && !stagedPost) {
    return null;
  }

  return (
    <div className="results-section">
      {/* Zeigt einen einfachen Status an, solange kein Post zur Freigabe bereit ist */}
      {result && !stagedPost && (
        <div className="progress-card">
          <h3>Status</h3>
          <div className={`status-item status-${result.status}`}>
            <span className="status-text">{result.message}</span>
            {result.postUrl && <a href={result.postUrl} target="_blank" rel="noopener noreferrer" style={{marginLeft: '1rem'}}>Zum Post</a>}
          </div>
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

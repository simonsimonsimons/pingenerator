import React from 'react';

export function ResultsSection({ results }) {
  if (!results.blog) return null;

  return (
    <div className="result-card">
      <div className="result-header">📄 Blogpost Vorschau</div>
      <div
        className="blog-preview"
        dangerouslySetInnerHTML={{ __html: results.blog }}
      />

      {/* Affiliate-Link aus Env (für CRA) */}
      {process.env.REACT_APP_AFFILIATE_LINK && (
        <div className="affiliate-link" style={{ marginTop: '1rem' }}>
          <a
            href={process.env.REACT_APP_AFFILIATE_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Unterstütze uns mit einem Klick auf diesen Link
          </a>
        </div>
      )}
    </div>
  );
}
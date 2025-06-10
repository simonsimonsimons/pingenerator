import React from 'react';

// KORREKTER DEFAULT EXPORT
export default function ResultsSection({ results }) {
  if (!results.blog && !results.image) return null;

  return (
    <div className="results-section">
      {results.blog && (
        <div className="result-card">
          <div className="result-header">📄 Blogpost Vorschau</div>
          <div className="blog-preview" dangerouslySetInnerHTML={{ __html: results.blog }} />
        </div>
      )}
      {results.image && (
        <div className="result-card">
          <div className="result-header">🎨 Pinterest-Bild</div>
          <img className="image-preview" src={results.image} alt="Generiertes Pinterest-Bild" />
        </div>
      )}

      {/* Affiliate-Link wird hier nicht mehr direkt aus process.env gelesen.
          Das sollte serverseitig passieren und als Teil des blog-Inhalts kommen. */}
    </div>
  );
}
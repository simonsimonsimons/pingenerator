import React from 'react';

export default function ResultsSection({ results, stagedPost, onApprove, onRegenerate }) {
  return (
    <div className="results-section">
      {/* Freigabe-Sektion, wird nur angezeigt, wenn ein Artikel zur Prüfung bereitsteht */}
      {stagedPost && (
        <div className="review-card">
          <h3>Vorschau & Freigabe</h3>
          <div className="blog-preview" dangerouslySetInnerHTML={{ __html: stagedPost.content }} />
          <div className="review-actions">
            <button className="approve-btn" onClick={onApprove}>✅ Freigeben & Posten</button>
            <button className="regenerate-btn" onClick={onRegenerate}>🔄 Erneut generieren</button>
          </div>
        </div>
      )}

      {/* Fortschrittstabelle, wird immer angezeigt, wenn Ergebnisse vorhanden sind */}
      {results.length > 0 && (
        <div className="progress-card">
          <h3>📋 Verarbeitungs-Protokoll</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Zeile</th>
                <th>Thema</th>
                <th>Status</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={index} className={`status-${item.status}`}>
                  <td>{index + 1}</td>
                  <td>{item.topic}</td>
                  <td>{item.message}</td>
                  <td>
                    {item.postUrl ? 
                      <a href={item.postUrl} target="_blank" rel="noopener noreferrer">Ansehen</a> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import React from 'react';

export default function ResultsSection({ results }) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="results-section">
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
  );
}
// Fügen Sie CSS für die Tabelle in App.css hinzu (siehe unten)
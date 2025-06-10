import React from 'react';

export default function StatusSection({ status }) {
  if (Object.keys(status).length === 0) return null;

  return (
    <div className="status-section">
      <h3>🔄 Fortschritt</h3>
      {Object.entries(status).map(([key, st]) => (
        <div key={key} className={`status-item ${st.state}`}>
          <span className="status-icon">
            {st.state === 'loading' ? <div className="loading-spinner" /> : (st.state === 'success' ? '✅' : '❌')}
          </span>
          <span className="status-text">{st.text}</span>
        </div>
      ))}
    </div>
  );
}
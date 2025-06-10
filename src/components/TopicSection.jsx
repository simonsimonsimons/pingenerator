import React from 'react';

export default function TopicSection({ onFileChange, onStart, isProcessing, fileName }) {
  return (
    <div className="topic-section">
      <h2>🚀 CSV-Upload & Start</h2>
      <div className="form-group">
        <label htmlFor="csv-upload" className="csv-upload-label">
          1. Wähle deine CSV-Datei aus
        </label>
        <input 
          id="csv-upload"
          type="file" 
          accept=".csv" 
          onChange={onFileChange} 
        />
        {fileName && <p>Ausgewählte Datei: <strong>{fileName}</strong></p>}
      </div>
      <button className="generate-btn" onClick={onStart} disabled={isProcessing || !fileName}>
        {isProcessing ? 'Verarbeite...' : '2. Verarbeitung starten'}
      </button>
    </div>
  );
}
import React from 'react';

export default function TopicSection({ 
  inputMode, 
  setInputMode,
  topicData, 
  setTopicData,
  onFileChange, 
  fileName,
  onStart, 
  isProcessing 
}) {
  const updateManual = (key, value) => setTopicData(td => ({ ...td, [key]: value }));

  return (
    <div className="topic-section">
      <div className="tab-buttons">
        <button 
          className={inputMode === 'manual' ? 'active' : ''} 
          onClick={() => setInputMode('manual')}
        >
          Manuelle Eingabe
        </button>
        <button 
          className={inputMode === 'csv' ? 'active' : ''} 
          onClick={() => setInputMode('csv')}
        >
          CSV-Upload
        </button>
      </div>

      {inputMode === 'manual' && (
        <div className="tab-content">
          <h2>Einzelnen Artikel generieren</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Anlass:</label>
              <input type="text" value={topicData.anlass} onChange={e => updateManual('anlass', e.target.value)} placeholder="z.B. Geburtstag, Weihnachten" />
            </div>
            {/* Fügen Sie hier die anderen manuellen Eingabefelder wieder hinzu (Alter, Beruf, etc.) */}
            <div className="form-group">
              <label>Hobby/Interessen:</label>
              <input type="text" value={topicData.hobby} onChange={e => updateManual('hobby', e.target.value)} placeholder="z.B. Kochen, Wandern" />
            </div>
          </div>
        </div>
      )}

      {inputMode === 'csv' && (
        <div className="tab-content">
          <h2>Mehrere Artikel per CSV generieren</h2>
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
        </div>
      )}

      <button className="generate-btn" onClick={onStart} disabled={isProcessing}>
        {isProcessing ? 'Verarbeite...' : 'Verarbeitung starten'}
      </button>
    </div>
  );
}
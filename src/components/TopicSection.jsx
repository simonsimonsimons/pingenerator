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
            <div className="form-group">
              <label>Alter (ca.):</label>
              <input type="text" value={topicData.alter} onChange={e => updateManual('alter', e.target.value)} placeholder="z.B. 30" />
            </div>
            <div className="form-group">
              <label>Beruf/Typ:</label>
              <input type="text" value={topicData.beruf} onChange={e => updateManual('beruf', e.target.value)} placeholder="z.B. Büroangestellte, Sportler" />
            </div>
            <div className="form-group">
              <label>Hobby/Interessen:</label>
              <input type="text" value={topicData.hobby} onChange={e => updateManual('hobby', e.target.value)} placeholder="z.B. Lesen, Gartenarbeit" />
            </div>
            <div className="form-group">
              <label>Stil:</label>
              <input type="text" value={topicData.stil} onChange={e => updateManual('stil', e.target.value)} placeholder="z.B. humorvoll, luxuriös, praktisch" />
            </div>
            <div className="form-group">
              <label>Budget (optional):</label>
              <input type="text" value={topicData.budget} onChange={e => updateManual('budget', e.target.value)} placeholder="z.B. unter 100 Euro" />
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
        {isProcessing ? 'Verarbeitung läuft...' : 'Verarbeitung starten'}
      </button>
    </div>
  );
}
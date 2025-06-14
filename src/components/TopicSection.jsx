import React from 'react';

export default function TopicSection({ topicData, setTopicData, onGenerateText, isProcessing }) {
  const updateManual = (key, value) => setTopicData(td => ({ ...td, [key]: value }));

  return (
    <div className="topic-section">
      <h2>Schritt 1: Thema definieren</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Anlass:</label>
          <input type="text" value={topicData.anlass} onChange={e => updateManual('anlass', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Zielperson (Beruf/Typ):</label>
          <input type="text" value={topicData.beruf} onChange={e => updateManual('beruf', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Hobby/Interessen:</label>
          <input type="text" value={topicData.hobby} onChange={e => updateManual('hobby', e.target.value)} />
        </div>
      </div>
      <button className="generate-btn" onClick={onGenerateText} disabled={isProcessing}>
        {isProcessing ? 'Generiere...' : 'Text generieren'}
      </button>
    </div>
  );
}

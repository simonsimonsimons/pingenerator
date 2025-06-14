import React from 'react';

export default function TopicSection({ topicData, setTopicData, onGenerateText, isProcessing }) {
  const updateManual = (key, value) => setTopicData(td => ({ ...td, [key]: value }));

  return (
    <div className="topic-section">
      <h2>Thema definieren</h2>
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
          <label>Zielperson (Beruf/Typ):</label>
          <input type="text" value={topicData.beruf} onChange={e => updateManual('beruf', e.target.value)} placeholder="z.B. Handwerker, Gamerin" />
        </div>
        <div className="form-group">
          <label>Hobby/Interessen:</label>
          <input type="text" value={topicData.hobby} onChange={e => updateManual('hobby', e.target.value)} placeholder="z.B. Kochen, Wandern" />
        </div>
        <div className="form-group">
          <label>Stil:</label>
          <input type="text" value={topicData.stil} onChange={e => updateManual('stil', e.target.value)} placeholder="z.B. humorvoll, praktisch" />
        </div>
        <div className="form-group">
          <label>Budget (optional):</label>
          <input type="text" value={topicData.budget} onChange={e => updateManual('budget', e.target.value)} placeholder="z.B. unter 50 Euro" />
        </div>
      </div>
      <button className="generate-btn" onClick={onGenerateText} disabled={isProcessing}>
        {isProcessing ? 'Generiere...' : 'Schritt 1: Text generieren'}
      </button>
    </div>
  );
}

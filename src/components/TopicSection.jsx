import React from 'react';

export default function TopicSection({ topicData, setTopicData, onGenerate, isGenerating }) {
  const update = (key, value) => setTopicData(td => ({ ...td, [key]: value }));

  return (
    <div className="topic-section">
      <h2>🎁 Für wen ist das Geschenk?</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Anlass:</label>
          <input type="text" value={topicData.anlass} onChange={e => update('anlass', e.target.value)} placeholder="z.B. Geburtstag, Weihnachten" />
        </div>
        <div className="form-group">
          <label>Alter (ca.):</label>
          <input type="text" value={topicData.alter} onChange={e => update('alter', e.target.value)} placeholder="z.B. 30-40" />
        </div>
        <div className="form-group">
          <label>Beruf/Typ:</label>
          <input type="text" value={topicData.beruf} onChange={e => update('beruf', e.target.value)} placeholder="z.B. Handwerker, Gamerin" />
        </div>
        <div className="form-group">
          <label>Hobby/Interessen:</label>
          <input type="text" value={topicData.hobby} onChange={e => update('hobby', e.target.value)} placeholder="z.B. Kochen, Wandern" />
        </div>
        <div className="form-group">
          <label>Stil:</label>
          <input type="text" value={topicData.stil} onChange={e => update('stil', e.target.value)} placeholder="z.B. modern, lustig, praktisch" />
        </div>
        <div className="form-group">
          <label>Budget (optional):</label>
          <input type="text" value={topicData.budget} onChange={e => update('budget', e.target.value)} placeholder="z.B. bis 50 Euro" />
        </div>
      </div>
      <button className="generate-btn" onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? 'Suche Ideen...' : '✨ Geschenkideen finden'}
      </button>
    </div>
  );
}

// Fügen Sie dieses CSS zu Ihrer App.css hinzu für ein schöneres Grid-Layout
/*
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}
*/
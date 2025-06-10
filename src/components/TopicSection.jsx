import React from 'react';

export default function TopicSection({ topicData, setTopicData, onGenerate, isGenerating }) {
  const update = (key, value) => setTopicData(td => ({ ...td, [key]: value }));

  return (
    <div className="topic-section">
      <h2>📝 Content erstellen</h2>
      <div className="form-group">
        <label>Thema:</label>
        <textarea
          rows="4"
          value={topicData.topic}
          onChange={e => update('topic', e.target.value)}
          placeholder="Gib hier das Thema für deinen Blogpost ein..."
        />
      </div>
      <div className="form-group">
        <label>Stil:</label>
        <select value={topicData.style} onChange={e => update('style', e.target.value)}>
          <option value="professional">Professionell</option>
          <option value="casual">Locker</option>
          <option value="expert">Fachlich</option>
          <option value="beginner">Einsteiger</option>
        </select>
      </div>
      <button className="generate-btn" onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generiere...' : '✨ Generieren'}
      </button>
    </div>
  );
}
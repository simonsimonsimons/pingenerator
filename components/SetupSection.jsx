import React from 'react';

export default function SetupSection({ config, setConfig }) {
  const update = (key, value) => setConfig(c => ({ ...c, [key]: value }));

  return (
    <div className="setup-section">
      <h2>Konfiguration</h2>
      <div className="form-group">
        <label>Gemini Modell:</label>
        <select value={config.geminiModel} onChange={e => update('geminiModel', e.target.value)}>
          <option value="gemini-pro">Gemini Pro</option>
          <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
        </select>
      </div>
    </div>
  );
}
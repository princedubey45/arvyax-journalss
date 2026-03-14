import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api/journal';
const USER_ID = 'user_123';

export default function App() {
  const [ambience, setAmbience] = useState('forest');
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadEntries();
    loadInsights();
  }, []);

  async function loadEntries() {
    try {
      const res = await fetch(`${API_BASE}/${USER_ID}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    }
  }

  async function loadInsights() {
    try {
      const res = await fetch(`${API_BASE}/insights/${USER_ID}`);
      const data = await res.json();
      setInsights(data);
    } catch {
      setInsights(null);
    }
  }

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, ambience, text })
      });
      if (res.ok) {
        setText('');
        setStatusMsg('✅ Entry saved!');
        await loadEntries();
        await loadInsights();
      } else {
        setStatusMsg('❌ Failed to save.');
      }
    } catch {
      setStatusMsg('❌ Network error.');
    }
    setSaving(false);
  }

  async function handleAnalyzeEntry(entryId) {
    setAnalyzingId(entryId);
    try {
      const res = await fetch(`${API_BASE}/${entryId}/analyze`, { method: 'POST' });
      if (res.ok) {
        await loadEntries();
        await loadInsights();
      }
    } catch {
      alert('Analysis failed. Check your API key.');
    }
    setAnalyzingId(null);
  }

  const s = {
    page: { fontFamily: 'sans-serif', background: '#eaf4ee', minHeight: '100vh', padding: 24 },
    wrap: { maxWidth: 780, margin: '0 auto' },
    card: { background: '#fff', borderRadius: 10, padding: 22, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.09)' },
    h1: { color: '#1b4332', margin: '0 0 4px' },
    h2: { color: '#2d6a4f', marginTop: 0 },
    label: { display: 'block', fontWeight: 600, marginBottom: 6, color: '#333' },
    select: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #b7d5c0', marginBottom: 14, fontSize: 14 },
    textarea: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #b7d5c0', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' },
    btn: { background: '#2d6a4f', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 6, cursor: 'pointer', fontSize: 14, marginRight: 10 },
    btnSm: { background: '#52b788', color: '#fff', border: 'none', padding: '5px 13px', borderRadius: 5, cursor: 'pointer', fontSize: 13 },
    tag: { display: 'inline-block', background: '#d8f3dc', color: '#1b4332', borderRadius: 20, padding: '3px 11px', marginRight: 6, marginBottom: 4, fontSize: 13 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    box: { background: '#f0faf3', border: '1px solid #b7d5c0', borderRadius: 8, padding: 14, textAlign: 'center' },
    bigVal: { fontSize: 26, fontWeight: 700, color: '#1b4332' },
    boxLabel: { fontSize: 12, color: '#52b788', marginTop: 2 },
    entryRow: { borderLeft: '4px solid #52b788', paddingLeft: 14, marginBottom: 18 },
    meta: { fontSize: 12, color: '#888', marginLeft: 8 },
    status: { color: '#2d6a4f', fontSize: 14 }
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* Header */}
        <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <h1 style={s.h1}>🌿 ArvyaX Journal</h1>
            <span style={{ color: '#888', fontSize: 13 }}>Nature Wellness • User: {USER_ID}</span>
          </div>
        </div>

        {/* Write Entry */}
        <div style={s.card}>
          <h2 style={s.h2}>Write Journal Entry</h2>
          <label style={s.label}>Session Ambience</label>
          <select style={s.select} value={ambience} onChange={e => setAmbience(e.target.value)}>
            <option value="forest">🌲 Forest</option>
            <option value="ocean">🌊 Ocean</option>
            <option value="mountain">🏔️ Mountain</option>
          </select>
          <label style={s.label}>How did you feel?</label>
          <textarea
            style={s.textarea}
            rows={4}
            placeholder="e.g. I felt calm today after listening to the rain..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            <button style={s.btn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
            {statusMsg && <span style={s.status}>{statusMsg}</span>}
          </div>
        </div>

        {/* Insights */}
        {insights && (
          <div style={s.card}>
            <h2 style={s.h2}>📊 Insights</h2>
            <div style={s.grid}>
              <div style={s.box}>
                <div style={s.bigVal}>{insights.totalEntries}</div>
                <div style={s.boxLabel}>Total Entries</div>
              </div>
              <div style={s.box}>
                <div style={s.bigVal}>{insights.topEmotion || '—'}</div>
                <div style={s.boxLabel}>Top Emotion</div>
              </div>
              <div style={s.box}>
                <div style={s.bigVal}>{insights.mostUsedAmbience || '—'}</div>
                <div style={s.boxLabel}>Favourite Ambience</div>
              </div>
              <div style={{ ...s.box, textAlign: 'left' }}>
                <div style={s.boxLabel}>Recent Keywords</div>
                <div style={{ marginTop: 6 }}>
                  {insights.recentKeywords && insights.recentKeywords.length > 0
                    ? insights.recentKeywords.map(k => <span key={k} style={s.tag}>{k}</span>)
                    : <span style={{ color: '#aaa', fontSize: 13 }}>Analyze entries to see keywords</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Entries */}
        <div style={s.card}>
          <h2 style={s.h2}>📖 Previous Entries</h2>
          {entries.length === 0 && (
            <p style={{ color: '#888' }}>No entries yet — write your first one above!</p>
          )}
          {entries.map(entry => (
            <div key={entry.id} style={s.entryRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>
                    {entry.ambience === 'forest' ? '🌲' : entry.ambience === 'ocean' ? '🌊' : '🏔️'}
                    {' '}{entry.ambience.charAt(0).toUpperCase() + entry.ambience.slice(1)}
                  </strong>
                  <span style={s.meta}>{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <button
                  style={s.btnSm}
                  onClick={() => handleAnalyzeEntry(entry.id)}
                  disabled={analyzingId === entry.id}
                >
                  {analyzingId === entry.id ? '⏳ Analyzing...' : '🔍 Analyze'}
                </button>
              </div>

              <p style={{ margin: '8px 0 6px', color: '#333', fontSize: 14 }}>{entry.text}</p>

              {entry.emotion && (
                <div>
                  <span style={{ ...s.tag, background: '#c3fae8' }}>😊 {entry.emotion}</span>
                  {entry.keywords.map(k => <span key={k} style={s.tag}>{k}</span>)}
                  {entry.summary && (
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#555', fontStyle: 'italic' }}>
                      {entry.summary}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

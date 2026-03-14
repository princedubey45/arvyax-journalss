const fetch = require('node-fetch');

const HF_API = 'https://api-inference.huggingface.co/models';
const HF_TOKEN = process.env.HF_TOKEN || ''; // Free HF token — set in .env

// In-memory cache — same text skips the API call entirely
const analysisCache = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────────

async function hfPost(model, payload) {
  const headers = { 'Content-Type': 'application/json' };
  if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error (${res.status}): ${err}`);
  }
  return res.json();
}

// Extract keywords: pick meaningful words (nouns/adj, length > 3, not stopwords)
function extractKeywords(text) {
  const stopwords = new Set([
    'after','today','felt','that','this','with','have','from','they',
    'were','been','will','just','your','when','then','than','also',
    'into','very','some','what','which','about','there','their','would',
    'could','should','like','really','every','during','while','upon'
  ]);
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const unique = [...new Set(words)].filter(w => !stopwords.has(w));
  return unique.slice(0, 5);
}

// ── Main export ───────────────────────────────────────────────────────────────

async function analyzeEmotion(text) {
  const cacheKey = text.trim().toLowerCase();
  if (analysisCache.has(cacheKey)) {
    console.log('[LLM] Cache hit — skipping API call');
    return analysisCache.get(cacheKey);
  }

  let emotion = 'neutral';
  let summary = `User reflected on their nature session: "${text.slice(0, 80)}..."`;
  const keywords = extractKeywords(text);

  try {
    // ── Step 1: Emotion classification (free HF model) ──────────────────────
    // Model: j-hartmann/emotion-english-distilroberta-base
    // Returns labels like: joy, sadness, anger, fear, surprise, disgust, neutral
    const emotionRes = await hfPost(
      'j-hartmann/emotion-english-distilroberta-base',
      { inputs: text }
    );

    // Response is [[{ label, score }, ...]] — pick highest score
    const emotionList = Array.isArray(emotionRes[0]) ? emotionRes[0] : emotionRes;
    if (emotionList && emotionList.length > 0) {
      const top = emotionList.sort((a, b) => b.score - a.score)[0];
      emotion = top.label.toLowerCase();
    }

    // ── Step 2: Build a summary from the emotion + text ──────────────────────
    const emotionToState = {
      joy: 'positive and joyful',
      neutral: 'calm and balanced',
      sadness: 'reflective and melancholic',
      anger: 'tense or frustrated',
      fear: 'anxious or uneasy',
      surprise: 'surprised or stimulated',
      disgust: 'unsettled or uncomfortable'
    };
    const stateDesc = emotionToState[emotion] || emotion;
    summary = `User experienced a ${stateDesc} mental state during their nature session.`;

  } catch (err) {
    console.error('[LLM] Hugging Face error:', err.message);
    // Graceful fallback — still return a usable result
  }

  const result = { emotion, keywords, summary };
  analysisCache.set(cacheKey, result);
  return result;
}

module.exports = { analyzeEmotion };


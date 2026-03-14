const express = require('express');
const router = express.Router();
const { JournalEntry } = require('../db');
const { analyzeEmotion } = require('../services/llmService');

// ─────────────────────────────────────────────
// POST /api/journal
// Create a new journal entry
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, ambience, text } = req.body;
    if (!userId || !ambience || !text) {
      return res.status(400).json({ error: 'userId, ambience, and text are required' });
    }

    const entry = await JournalEntry.create({ userId, ambience, text });

    res.status(201).json({
      id: entry._id,
      userId: entry.userId,
      ambience: entry.ambience,
      text: entry.text,
      createdAt: entry.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

// ─────────────────────────────────────────────
// POST /api/journal/analyze
// Analyze emotion from any text via LLM
// NOTE: Must be defined BEFORE GET /:userId
// ─────────────────────────────────────────────
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await analyzeEmotion(text);
    // { "emotion": "calm", "keywords": ["rain","nature","peace"], "summary": "..." }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// ─────────────────────────────────────────────
// GET /api/journal/insights/:userId
// Aggregated mental wellness insights
// NOTE: Must be defined BEFORE GET /:userId
// ─────────────────────────────────────────────
router.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const entries = await JournalEntry.find({ userId }).lean();

    if (entries.length === 0) {
      return res.json({ totalEntries: 0, topEmotion: null, mostUsedAmbience: null, recentKeywords: [] });
    }

    // Top emotion
    const emotionCounts = {};
    entries.forEach(e => {
      if (e.emotion) emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });
    const topEmotion = Object.keys(emotionCounts).sort((a, b) => emotionCounts[b] - emotionCounts[a])[0] || null;

    // Most used ambience
    const ambienceCounts = {};
    entries.forEach(e => {
      ambienceCounts[e.ambience] = (ambienceCounts[e.ambience] || 0) + 1;
    });
    const mostUsedAmbience = Object.keys(ambienceCounts).sort((a, b) => ambienceCounts[b] - ambienceCounts[a])[0] || null;

    // Recent keywords from last 5 entries
    const recentEntries = [...entries]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentKeywords = [
      ...new Set(recentEntries.flatMap(e => e.keywords || []))
    ].slice(0, 10);

    res.json({ totalEntries: entries.length, topEmotion, mostUsedAmbience, recentKeywords });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ─────────────────────────────────────────────
// GET /api/journal/:userId
// Get all entries for a user
// NOTE: Wildcard — must be AFTER /analyze and /insights/:userId
// ─────────────────────────────────────────────
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const entries = await JournalEntry.find({ userId }).sort({ createdAt: -1 }).lean();

    res.json(entries.map(e => ({
      id: e._id,
      userId: e.userId,
      ambience: e.ambience,
      text: e.text,
      emotion: e.emotion,
      keywords: e.keywords || [],
      summary: e.summary,
      createdAt: e.createdAt
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// ─────────────────────────────────────────────
// POST /api/journal/:entryId/analyze
// Analyze a saved entry and persist the result
// ─────────────────────────────────────────────
router.post('/:entryId/analyze', async (req, res) => {
  try {
    const { entryId } = req.params;
    const entry = await JournalEntry.findById(entryId);

    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const result = await analyzeEmotion(entry.text);

    entry.emotion = result.emotion;
    entry.keywords = result.keywords;
    entry.summary = result.summary;
    await entry.save();

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze entry' });
  }
});

module.exports = router;

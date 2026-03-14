const mongoose = require('mongoose');

// ── Connect ───────────────────────────────────────────────────────────────────
async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arvyax_journal';
  await mongoose.connect(uri);
  console.log('[DB] MongoDB connected:', uri);
}

// ── Schema ────────────────────────────────────────────────────────────────────
const journalSchema = new mongoose.Schema(
  {
    userId:   { type: String, required: true, index: true },
    ambience: { type: String, required: true, enum: ['forest', 'ocean', 'mountain'] },
    text:     { type: String, required: true },
    emotion:  { type: String, default: null },
    keywords: { type: [String], default: [] },
    summary:  { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const JournalEntry = mongoose.model('JournalEntry', journalSchema);

module.exports = { connectDb, JournalEntry };

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connectDb } = require('./db');
const journalRoutes = require('./routes/journal');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rate limiting: 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use('/api/journal', journalRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Connect to MongoDB first, then start server
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ArvyaX Journal API running on http://localhost:${PORT}`);
      console.log(`Test analyze: POST http://localhost:${PORT}/api/journal/analyze`);
      console.log(`Test insights: GET  http://localhost:${PORT}/api/journal/insights/:userId`);
    });
  })
  .catch(err => {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  });

# ArvyaX Journal System

AI-powered journal for nature immersion sessions with LLM emotion analysis and wellness insights.

## Stack
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **LLM:** Hugging Face Inference API (FREE — `j-hartmann/emotion-english-distilroberta-base`)
- **Frontend:** React

## Project Structure
```
project/
├── backend/
│   ├── routes/journal.js      ← All 5 API endpoints
│   ├── services/llmService.js ← LLM + in-memory cache
│   ├── db.js                  ← MongoDB/Mongoose connection + schema
│   ├── server.js              ← Express app
│   └── .env.example
└── frontend/
    ├── src/App.js             ← Single page UI
    └── public/index.html
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally OR use Docker Compose (easiest)

### Option A — Docker (recommended, runs everything)
```bash
cp backend/.env.example backend/.env
# Optionally add HF_TOKEN to backend/.env
docker-compose up --build
```

### Option B — Manual

**MongoDB** (install from https://www.mongodb.com/try/download/community, then):
```bash
mongod --dbpath /data/db
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Add HF_TOKEN to .env (free at https://huggingface.co/settings/tokens)
npm start
# Runs on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/journal | Save a new entry |
| GET | /api/journal/:userId | Get all entries |
| POST | /api/journal/analyze | Analyze any text |
| GET | /api/journal/insights/:userId | Get insights |
| POST | /api/journal/:entryId/analyze | Analyze & save a stored entry |

### POST /api/journal
```json
{ "userId": "123", "ambience": "forest", "text": "I felt calm today after listening to the rain." }
```

### POST /api/journal/analyze
```json
Input:  { "text": "I felt calm today after listening to the rain" }
Output: { "emotion": "calm", "keywords": ["rain","nature","peace"], "summary": "..." }
```

### GET /api/journal/insights/:userId
```json
{
  "totalEntries": 8,
  "topEmotion": "calm",
  "mostUsedAmbience": "forest",
  "recentKeywords": ["focus", "nature", "rain"]
}
```

## Bonus Features
- ✅ In-memory LLM response caching
- ✅ Rate limiting (100 req / 15 min)
- ✅ Docker + docker-compose (includes MongoDB container)

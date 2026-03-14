# ARCHITECTURE.md

## System Diagram
```
[React Frontend :3000] ──HTTP──► [Express API :3001] ──► [SQLite journal.db]
                                         │
                                         └──► [Anthropic Claude API]
```

---

## 1. How would you scale this to 100k users?

- **Database:** Replace SQLite with PostgreSQL (e.g. AWS RDS). SQLite is single-writer and cannot handle concurrent load.
- **API:** Deploy multiple Express instances behind a load balancer (AWS ALB + ECS or Kubernetes). Node.js is stateless so horizontal scaling is easy.
- **LLM calls:** Move to an async job queue (BullMQ + Redis). Entry saves return instantly; analysis runs in the background.
- **Frontend:** Serve via CDN (Cloudflare / S3 + CloudFront).
- **Rate limiting:** Move from in-process to Redis-backed rate limiter shared across all instances.

---

## 2. How would you reduce LLM cost?

1. **Cache results** — same text → skip the API call entirely (already implemented).
2. **Hash deduplication** — store SHA-256 of entry text in DB; check before calling LLM.
3. **Cheaper model** — use `claude-haiku` (already used) instead of Sonnet/Opus for simple entries.
4. **Batch processing** — group multiple short entries into one prompt.
5. **Strict token limits** — keep `max_tokens: 300`; structured JSON output is short.

---

## 3. How would you cache repeated analysis?

**Current:** In-memory Map in `llmService.js` (resets on restart, single process only).

**Production:**
```
Request → hash(text) → check Redis → HIT: return cached
                                   → MISS: call LLM → store in Redis (TTL 7 days) → return
```
- Key: `analysis:<sha256(text)>`
- Value: JSON string of `{ emotion, keywords, summary }`
- Also add a `text_hash` column to `journal_entries` to avoid re-analyzing on next load.

---

## 4. How would you protect sensitive journal data?

| Layer | Measure |
|-------|---------|
| Transport | HTTPS / TLS everywhere |
| Auth | Replace plain userId with JWT (Auth0 or Supabase Auth) |
| Authorization | Validate JWT subject == userId on every request |
| Encryption at rest | Encrypted DB volumes (AWS EBS) or PostgreSQL TDE |
| Field-level encryption | Encrypt `text` column in app layer before writing |
| Data retention | Let users delete entries; auto-expire after N days |
| LLM privacy | Send only journal text to LLM — never userId or PII |
| Audit logs | Log all access with timestamps for compliance |

---

## Data Model

```sql
journal_entries
├── id          INTEGER PRIMARY KEY AUTOINCREMENT
├── user_id     TEXT NOT NULL   -- indexed
├── ambience    TEXT NOT NULL   -- forest | ocean | mountain
├── text        TEXT NOT NULL   -- raw journal entry
├── emotion     TEXT            -- LLM: single emotion word
├── keywords    TEXT            -- LLM: JSON array e.g. ["rain","peace"]
├── summary     TEXT            -- LLM: one-sentence summary
└── created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
```

# MarketScout

Unified marketplace search across messy sites like Craigslist and eBay. Enter a query and location, and MarketScout fans out parallel agents to browse listings, scores them for reliability and scam risk, and presents everything in a clean interface.

## Features

- Search Craigslist and eBay in parallel
- Location-aware search (zip code + radius)
- Live agent progress via Server-Sent Events
- Reliability scoring (seller reputation, price reasonableness, listing quality)
- Scam risk detection (rule-based + optional OpenAI analysis)
- Sort and filter results by reliability, price, distance, and date
- Settings for default location and filters

## Project structure

```
marketscout/
├── apps/
│   ├── web/     # Next.js frontend (port 3000)
│   └── api/     # FastAPI backend (port 8000)
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- (Optional) eBay Developer Program credentials
- (Optional) OpenAI API key for AI scam analysis

## Setup

### 1. Environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `EBAY_CLIENT_ID` | For real eBay results | From [developer.ebay.com](https://developer.ebay.com) |
| `EBAY_CLIENT_SECRET` | For real eBay results | eBay OAuth client secret |
| `OPENAI_API_KEY` | Optional | Enables LLM scam/reliability enrichment |
| `API_PORT` | No | Default `8000` |
| `API_URL` | No | Used by Next.js rewrites, default `http://localhost:8000` |

Without eBay credentials, the eBay adapter returns a sample listing so you can test the UI.

### 2. Backend (FastAPI)

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Optional: for Craigslist Playwright fallback
playwright install chromium

# Run from apps/api so imports resolve
uvicorn main:app --reload --port 8000
```

### 3. Frontend (Next.js)

In a second terminal:

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/search` | Start a search |
| GET | `/api/search/{id}/stream` | SSE stream of progress and scored listings |
| GET | `/api/search/{id}/results` | Final results (poll fallback) |

## How reliability scoring works

Each listing gets a 0–100 reliability score based on:

- **Seller reputation (35%)** — eBay feedback; Craigslist uses a neutral baseline
- **Price reasonableness (25%)** — compared to median price in the same search
- **Listing completeness (20%)** — photos, description, condition
- **Scam signal penalty (20%)** — wire transfer language, urgency, unusually low prices

When `OPENAI_API_KEY` is set, an LLM pass refines scam risk and adjusts the score.

## Legal notes

- **eBay** uses the official Browse API.
- **Craigslist** has no public API; results link out to Craigslist. Use polite rate limits.
- Facebook Marketplace and custom sites are planned for a future release.

## Future work

- Facebook Marketplace (requires authenticated browser sessions)
- User-added custom sites via Playwright + AI site mapping
- Redis cache upgrade

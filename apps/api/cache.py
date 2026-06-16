from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

import aiosqlite

from models import SearchRequest, SearchResults, UnifiedListing

DB_PATH = Path(__file__).parent / "marketscout.db"


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS search_cache (
                cache_key TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                created_at REAL NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS rate_limits (
                client_key TEXT PRIMARY KEY,
                last_search_at REAL NOT NULL
            )
            """
        )
        await db.commit()


def _cache_key(request: SearchRequest) -> str:
    raw = json.dumps(
        {
            "query": request.query.lower().strip(),
            "zip": request.zip_code,
            "radius": request.radius_miles,
            "sources": sorted(s.value for s in request.sources),
        },
        sort_keys=True,
    )
    return hashlib.sha256(raw.encode()).hexdigest()


async def get_cached_results(
    request: SearchRequest, ttl_seconds: int
) -> list[UnifiedListing] | None:
    key = _cache_key(request)
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT payload, created_at FROM search_cache WHERE cache_key = ?",
            (key,),
        )
        row = await cursor.fetchone()
        if not row:
            return None
        payload, created_at = row
        if time.time() - created_at > ttl_seconds:
            return None
        data = json.loads(payload)
        return [UnifiedListing.model_validate(item) for item in data]


async def set_cached_results(request: SearchRequest, listings: list[UnifiedListing]) -> None:
    key = _cache_key(request)
    payload = json.dumps([l.model_dump(mode="json") for l in listings])
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT OR REPLACE INTO search_cache (cache_key, payload, created_at)
            VALUES (?, ?, ?)
            """,
            (key, payload, time.time()),
        )
        await db.commit()


async def check_rate_limit(client_key: str, limit_seconds: int) -> bool:
    now = time.time()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT last_search_at FROM rate_limits WHERE client_key = ?",
            (client_key,),
        )
        row = await cursor.fetchone()
        if row and now - row[0] < limit_seconds:
            return False
        await db.execute(
            """
            INSERT OR REPLACE INTO rate_limits (client_key, last_search_at)
            VALUES (?, ?)
            """,
            (client_key, now),
        )
        await db.commit()
    return True

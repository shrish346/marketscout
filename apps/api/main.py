from __future__ import annotations

import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from cache import init_db
from models import SearchRequest, SearchResponse
from orchestrator import get_search, start_search, stream_events


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MarketScout API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


def _client_key(http_request: Request) -> str:
    # Behind the Next.js proxy, http_request.client.host is always the proxy's
    # IP, so prefer the forwarded client IP when the proxy provides it.
    forwarded = http_request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return http_request.client.host if http_request.client else "default"


@app.post("/api/search", response_model=SearchResponse)
async def create_search(request: SearchRequest, http_request: Request):
    client_key = _client_key(http_request)
    try:
        search_id, _ = await start_search(request, client_key=client_key)
    except ValueError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    return SearchResponse(search_id=search_id)


@app.get("/api/search/{search_id}/stream")
async def search_stream(search_id: str):
    if not get_search(search_id):
        raise HTTPException(status_code=404, detail="Search not found")

    async def event_generator():
        async for event in stream_events(search_id):
            yield f"data: {json.dumps(event.model_dump(mode='json'))}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.get("/api/search/{search_id}/results")
async def search_results(search_id: str):
    search = get_search(search_id)
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")
    return search

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncIterator
from typing import Callable

from adapters.craigslist import get_craigslist_adapter
from adapters.ebay import get_ebay_adapter
from cache import check_rate_limit, get_cached_results, set_cached_results
from config import get_settings
from models import (
    LocationContext,
    SearchEvent,
    SearchEventType,
    SearchRequest,
    SearchResults,
    SourceName,
    UnifiedListing,
)
from normalizer import normalize_listings
from scorer import score_listings

ADAPTERS = {
    SourceName.CRAIGSLIST: get_craigslist_adapter,
    SourceName.EBAY: get_ebay_adapter,
}

_searches: dict[str, SearchResults] = {}
_event_queues: dict[str, asyncio.Queue[SearchEvent | None]] = {}


def get_search(search_id: str) -> SearchResults | None:
    return _searches.get(search_id)


async def _emit(search_id: str, event: SearchEvent) -> None:
    queue = _event_queues.get(search_id)
    if queue:
        await queue.put(event)


async def _run_adapter(
    search_id: str,
    source: SourceName,
    query: str,
    location: LocationContext,
    timeout: float,
) -> list[UnifiedListing]:
    await _emit(
        search_id,
        SearchEvent(type=SearchEventType.SOURCE_STARTED, search_id=search_id, source=source),
    )

    adapter_factory = ADAPTERS.get(source)
    if not adapter_factory:
        await _emit(
            search_id,
            SearchEvent(
                type=SearchEventType.SOURCE_ERROR,
                search_id=search_id,
                source=source,
                error=f"No adapter for {source.value}",
            ),
        )
        return []

    adapter = adapter_factory()
    try:
        raw = await asyncio.wait_for(adapter.search(query, location), timeout=timeout)
        normalized = normalize_listings(raw)
        for listing in normalized:
            await _emit(
                search_id,
                SearchEvent(
                    type=SearchEventType.LISTING_FOUND,
                    search_id=search_id,
                    source=source,
                    listing=listing,
                ),
            )
        await _emit(
            search_id,
            SearchEvent(
                type=SearchEventType.SOURCE_DONE,
                search_id=search_id,
                source=source,
                count=len(normalized),
            ),
        )
        return normalized
    except asyncio.TimeoutError:
        await _emit(
            search_id,
            SearchEvent(
                type=SearchEventType.SOURCE_ERROR,
                search_id=search_id,
                source=source,
                error="Search timed out",
            ),
        )
        return []
    except Exception as exc:
        await _emit(
            search_id,
            SearchEvent(
                type=SearchEventType.SOURCE_ERROR,
                search_id=search_id,
                source=source,
                error=str(exc),
            ),
        )
        return []


async def run_search(search_id: str, request: SearchRequest) -> None:
    settings = get_settings()
    search = _searches[search_id]
    search.status = "running"

    try:
        cached = await get_cached_results(request, settings.cache_ttl_seconds)
        if cached:
            search.listings = cached
            for listing in cached:
                await _emit(
                    search_id,
                    SearchEvent(
                        type=SearchEventType.LISTING_SCORED,
                        search_id=search_id,
                        source=listing.source,
                        listing=listing,
                    ),
                )
            search.status = "complete"
            await _emit(
                search_id,
                SearchEvent(
                    type=SearchEventType.SEARCH_COMPLETE,
                    search_id=search_id,
                    count=len(cached),
                    message="Served from cache",
                ),
            )
            return

        location = LocationContext(zip_code=request.zip_code, radius_miles=request.radius_miles)
        tasks = [
            _run_adapter(search_id, source, request.query, location, settings.adapter_timeout_seconds)
            for source in request.sources
        ]
        results = await asyncio.gather(*tasks)
        all_listings = [item for batch in results for item in batch]

        scored = await score_listings(all_listings)
        search.listings = scored

        for listing in scored:
            await _emit(
                search_id,
                SearchEvent(
                    type=SearchEventType.LISTING_SCORED,
                    search_id=search_id,
                    source=listing.source,
                    listing=listing,
                ),
            )

        await set_cached_results(request, scored)
        search.status = "complete"
        await _emit(
            search_id,
            SearchEvent(
                type=SearchEventType.SEARCH_COMPLETE,
                search_id=search_id,
                count=len(scored),
            ),
        )
    except Exception as exc:  # noqa: BLE001 - surface any failure to the client
        search.status = "error"
        search.error = str(exc)
        await _emit(
            search_id,
            SearchEvent(
                type=SearchEventType.SEARCH_COMPLETE,
                search_id=search_id,
                count=len(search.listings),
                error=str(exc),
                message="Search failed",
            ),
        )
    finally:
        # Always terminate the SSE stream, even if the search crashed.
        queue = _event_queues.get(search_id)
        if queue:
            await queue.put(None)


async def start_search(
    request: SearchRequest,
    client_key: str = "default",
    on_started: Callable[[str], None] | None = None,
) -> tuple[str, bool]:
    settings = get_settings()
    allowed = await check_rate_limit(client_key, settings.rate_limit_seconds)
    if not allowed:
        raise ValueError("Rate limit exceeded. Please wait before searching again.")

    search_id = str(uuid.uuid4())
    _searches[search_id] = SearchResults(
        search_id=search_id,
        query=request.query,
        status="pending",
    )
    _event_queues[search_id] = asyncio.Queue()

    if on_started:
        on_started(search_id)

    asyncio.create_task(run_search(search_id, request))
    return search_id, True


async def stream_events(search_id: str) -> AsyncIterator[SearchEvent]:
    queue = _event_queues.get(search_id)
    if not queue:
        return

    while True:
        event = await queue.get()
        if event is None:
            break
        yield event

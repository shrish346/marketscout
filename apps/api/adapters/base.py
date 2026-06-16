from __future__ import annotations

from typing import Protocol

from models import LocationContext, RawListing, SourceName


class SiteAdapter(Protocol):
    name: SourceName

    async def search(self, query: str, location: LocationContext) -> list[RawListing]:
        """Fetch raw listings from a marketplace source."""

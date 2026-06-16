from __future__ import annotations

from models import RawListing, UnifiedListing


def normalize_listing(raw: RawListing) -> UnifiedListing:
    return UnifiedListing(
        id=f"{raw.source.value}:{raw.external_id}",
        source=raw.source,
        title=raw.title,
        price=raw.price,
        currency=raw.currency,
        location=raw.location,
        distance_miles=raw.distance_miles,
        image_urls=raw.image_urls,
        listing_url=raw.listing_url,
        description=raw.description,
        posted_at=raw.posted_at,
        seller=raw.seller,
        condition=raw.condition,
        shipping_cost=raw.shipping_cost,
        raw=raw.raw,
    )


def normalize_listings(raw_listings: list[RawListing]) -> list[UnifiedListing]:
    return [normalize_listing(item) for item in raw_listings]

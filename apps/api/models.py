from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class SourceName(str, Enum):
    CRAIGSLIST = "craigslist"
    EBAY = "ebay"


class ScamRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SellerInfo(BaseModel):
    name: str | None = None
    rating: float | None = None
    review_count: int | None = None
    verified: bool = False
    account_age_days: int | None = None


class ListingScores(BaseModel):
    reliability_score: float = 50.0
    scam_risk: ScamRisk = ScamRisk.LOW
    reasons: list[str] = Field(default_factory=list)
    seller_reputation: float = 50.0
    price_reasonableness: float = 50.0
    listing_completeness: float = 50.0
    scam_penalty: float = 0.0


class RawListing(BaseModel):
    external_id: str
    source: SourceName
    title: str
    price: float | None = None
    currency: str = "USD"
    location: str = ""
    distance_miles: float | None = None
    image_urls: list[str] = Field(default_factory=list)
    listing_url: str
    description: str = ""
    posted_at: datetime | None = None
    seller: SellerInfo = Field(default_factory=SellerInfo)
    condition: str | None = None
    shipping_cost: float | None = None
    raw: dict[str, Any] = Field(default_factory=dict)


class UnifiedListing(BaseModel):
    id: str
    source: SourceName
    title: str
    price: float | None = None
    currency: str = "USD"
    location: str = ""
    distance_miles: float | None = None
    image_urls: list[str] = Field(default_factory=list)
    listing_url: str
    description: str = ""
    posted_at: datetime | None = None
    seller: SellerInfo = Field(default_factory=SellerInfo)
    condition: str | None = None
    shipping_cost: float | None = None
    raw: dict[str, Any] = Field(default_factory=dict)
    scores: ListingScores = Field(default_factory=ListingScores)


class LocationContext(BaseModel):
    zip_code: str
    radius_miles: int = 25


class SearchRequest(BaseModel):
    query: str
    zip_code: str
    radius_miles: int = 25
    sources: list[SourceName] = Field(
        default_factory=lambda: [SourceName.CRAIGSLIST, SourceName.EBAY]
    )


class SearchResponse(BaseModel):
    search_id: str


class SearchEventType(str, Enum):
    SOURCE_STARTED = "source_started"
    SOURCE_DONE = "source_done"
    SOURCE_ERROR = "source_error"
    LISTING_FOUND = "listing_found"
    LISTING_SCORED = "listing_scored"
    SEARCH_COMPLETE = "search_complete"


class SearchEvent(BaseModel):
    type: SearchEventType
    search_id: str
    source: SourceName | None = None
    listing: UnifiedListing | None = None
    message: str | None = None
    count: int | None = None
    error: str | None = None


class SearchResults(BaseModel):
    search_id: str
    query: str
    status: Literal["pending", "running", "complete", "error"] = "pending"
    listings: list[UnifiedListing] = Field(default_factory=list)
    error: str | None = None

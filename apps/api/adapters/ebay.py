from __future__ import annotations

import base64
import time
from datetime import datetime

import httpx

from adapters.base import SiteAdapter
from config import get_settings
from models import LocationContext, RawListing, SellerInfo, SourceName

EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
EBAY_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"

_token_cache: dict[str, float | str] = {"token": "", "expires_at": 0.0}


async def _get_access_token() -> str | None:
    settings = get_settings()
    if not settings.ebay_client_id or not settings.ebay_client_secret:
        return None

    now = time.time()
    if _token_cache["token"] and now < float(_token_cache["expires_at"]):
        return str(_token_cache["token"])

    credentials = base64.b64encode(
        f"{settings.ebay_client_id}:{settings.ebay_client_secret}".encode()
    ).decode()

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            EBAY_AUTH_URL,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {credentials}",
            },
            data={
                "grant_type": "client_credentials",
                "scope": "https://api.ebay.com/oauth/api_scope",
            },
        )
        response.raise_for_status()
        data = response.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 7200) - 60
    return str(_token_cache["token"])


class EbayAdapter:
    name = SourceName.EBAY

    async def search(self, query: str, location: LocationContext) -> list[RawListing]:
        token = await _get_access_token()
        if not token:
            return self._mock_listings(query, location)

        params = {
            "q": query,
            "limit": "50",
            "filter": "buyingOptions:{FIXED_PRICE|AUCTION}",
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(EBAY_SEARCH_URL, params=params, headers=headers)
            if response.status_code == 401:
                _token_cache["expires_at"] = 0
                token = await _get_access_token()
                if not token:
                    return self._mock_listings(query, location)
                headers["Authorization"] = f"Bearer {token}"
                response = await client.get(EBAY_SEARCH_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

        return self._parse_response(data)

    def _parse_response(self, data: dict) -> list[RawListing]:
        listings: list[RawListing] = []
        for item in data.get("itemSummaries", []):
            price_info = item.get("price", {})
            price = float(price_info.get("value", 0)) if price_info.get("value") else None
            currency = price_info.get("currency", "USD")

            image_urls = []
            if item.get("image", {}).get("imageUrl"):
                image_urls.append(item["image"]["imageUrl"])
            for thumb in item.get("thumbnailImages", []):
                if thumb.get("imageUrl"):
                    image_urls.append(thumb["imageUrl"])

            seller_data = item.get("seller", {})
            feedback_pct = seller_data.get("feedbackPercentage")
            feedback_score = seller_data.get("feedbackScore")

            shipping_cost = None
            shipping_options = item.get("shippingOptions", [])
            if shipping_options:
                ship_price = shipping_options[0].get("shippingCost", {})
                if ship_price.get("value"):
                    shipping_cost = float(ship_price["value"])

            posted_at = None
            if item.get("itemCreationDate"):
                try:
                    posted_at = datetime.fromisoformat(
                        item["itemCreationDate"].replace("Z", "+00:00")
                    )
                except ValueError:
                    posted_at = None

            item_id = item.get("itemId", item.get("legacyItemId", ""))
            listings.append(
                RawListing(
                    external_id=str(item_id),
                    source=SourceName.EBAY,
                    title=item.get("title", "Untitled"),
                    price=price,
                    currency=currency,
                    location=item.get("itemLocation", {}).get("postalCode", "") or "US",
                    image_urls=image_urls[:5],
                    listing_url=item.get("itemWebUrl", f"https://www.ebay.com/itm/{item_id}"),
                    description=item.get("shortDescription", item.get("title", "")),
                    posted_at=posted_at,
                    condition=item.get("condition"),
                    shipping_cost=shipping_cost,
                    seller=SellerInfo(
                        name=seller_data.get("username"),
                        rating=float(feedback_pct) if feedback_pct else None,
                        review_count=int(feedback_score) if feedback_score else None,
                        verified=seller_data.get("sellerAccountType") == "BUSINESS",
                    ),
                    raw=item,
                )
            )
        return listings

    def _mock_listings(self, query: str, location: LocationContext) -> list[RawListing]:
        """Fallback when eBay credentials are not configured."""
        slug = query.replace(" ", "-").lower()[:30]
        return [
            RawListing(
                external_id=f"mock-ebay-{slug}",
                source=SourceName.EBAY,
                title=f"{query.title()} — eBay sample (configure EBAY_CLIENT_ID)",
                price=299.99,
                location=location.zip_code,
                image_urls=[],
                listing_url="https://www.ebay.com",
                description=f"Sample eBay listing for '{query}'. Add eBay API credentials to fetch real results.",
                seller=SellerInfo(name="sample_seller", rating=98.5, review_count=1200, verified=True),
                condition="Used",
                raw={"mock": True},
            )
        ]


def get_ebay_adapter() -> SiteAdapter:
    return EbayAdapter()

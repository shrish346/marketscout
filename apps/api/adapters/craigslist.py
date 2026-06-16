from __future__ import annotations

import re
from datetime import datetime
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from adapters.base import SiteAdapter
from adapters.zip_map import zip_to_subdomain
from models import LocationContext, RawListing, SellerInfo, SourceName

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def _parse_price(text: str) -> float | None:
    if not text:
        return None
    match = re.search(r"[\d,]+(?:\.\d{2})?", text.replace(",", ""))
    if not match:
        return None
    try:
        return float(match.group().replace(",", ""))
    except ValueError:
        return None


def _extract_external_id(url: str) -> str:
    match = re.search(r"/(\d+)\.html", url)
    return match.group(1) if match else url


class CraigslistAdapter:
    name = SourceName.CRAIGSLIST

    async def search(self, query: str, location: LocationContext) -> list[RawListing]:
        subdomain = zip_to_subdomain(location.zip_code)
        params = {
            "query": query,
            "search_distance": str(location.radius_miles),
            "postal": location.zip_code,
            "sort": "rel",
        }
        url = f"https://{subdomain}.craigslist.org/search/sss"
        headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}

        async with httpx.AsyncClient(
            timeout=15.0, follow_redirects=True, headers=headers
        ) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            html = response.text

        if "captcha" in html.lower() or len(html) < 500:
            return await self._search_with_playwright(query, location, subdomain)

        return self._parse_html(html, subdomain)

    def _parse_html(self, html: str, subdomain: str) -> list[RawListing]:
        soup = BeautifulSoup(html, "html.parser")
        listings: list[RawListing] = []
        base_url = f"https://{subdomain}.craigslist.org"

        for item in soup.select("li.cl-static-search-result, li.cl-search-result"):
            link = item.select_one("a[href]")
            if not link:
                continue

            href = link.get("href", "")
            listing_url = href if href.startswith("http") else urljoin(base_url, href)
            title_el = item.select_one(".title, .titlestring, .cl-title")
            title = (title_el.get_text(strip=True) if title_el else link.get_text(strip=True)) or "Untitled"

            price_el = item.select_one(".priceinfo, .price")
            price = _parse_price(price_el.get_text(strip=True) if price_el else "")

            location_el = item.select_one(".location, .meta .location")
            loc = location_el.get_text(strip=True).strip("()") if location_el else ""

            img_el = item.select_one("img")
            image_urls: list[str] = []
            if img_el and img_el.get("src"):
                image_urls.append(img_el["src"])

            datetime_el = item.select_one("time")
            posted_at = None
            if datetime_el and datetime_el.get("datetime"):
                try:
                    posted_at = datetime.fromisoformat(datetime_el["datetime"].replace("Z", "+00:00"))
                except ValueError:
                    posted_at = None

            listings.append(
                RawListing(
                    external_id=_extract_external_id(listing_url),
                    source=SourceName.CRAIGSLIST,
                    title=title,
                    price=price,
                    location=loc,
                    image_urls=image_urls,
                    listing_url=listing_url,
                    description=title,
                    posted_at=posted_at,
                    seller=SellerInfo(),
                    raw={"subdomain": subdomain},
                )
            )

        return listings

    async def _search_with_playwright(
        self, query: str, location: LocationContext, subdomain: str
    ) -> list[RawListing]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            return []

        from urllib.parse import quote_plus

        url = (
            f"https://{subdomain}.craigslist.org/search/sss"
            f"?query={quote_plus(query)}"
            f"&search_distance={location.radius_miles}"
            f"&postal={location.zip_code}"
        )

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(user_agent=USER_AGENT)
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            html = await page.content()
            await browser.close()

        return self._parse_html(html, subdomain)


def get_craigslist_adapter() -> SiteAdapter:
    return CraigslistAdapter()

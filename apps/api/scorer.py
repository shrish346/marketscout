from __future__ import annotations

import hashlib
import json
import re
import statistics
import time
from typing import Any

from config import get_settings
from models import ListingScores, ScamRisk, UnifiedListing

SCAM_KEYWORDS = [
    "wire transfer",
    "western union",
    "crypto",
    "bitcoin",
    "gift card",
    "venmo only",
    "cashapp only",
    "zelle only",
    "act fast",
    "urgent",
    "moving sale must go",
    "out of country",
    "shipping only",
    "paypal friends",
]

URGENCY_PATTERN = re.compile(r"\b(act fast|urgent|limited time|today only)\b", re.I)


def _median_price(listings: list[UnifiedListing]) -> float | None:
    prices = [l.price for l in listings if l.price is not None and l.price > 0]
    if not prices:
        return None
    return statistics.median(prices)


def _seller_reputation_score(listing: UnifiedListing) -> tuple[float, list[str]]:
    reasons: list[str] = []
    seller = listing.seller

    if listing.source.value == "craigslist":
        reasons.append("Craigslist has no seller ratings; using neutral baseline")
        return 55.0, reasons

    if seller.rating is None and seller.review_count is None:
        reasons.append("No seller feedback available")
        return 40.0, reasons

    score = 50.0
    if seller.rating is not None:
        score = min(100.0, seller.rating)
        if seller.rating < 95:
            reasons.append(f"Seller feedback {seller.rating}% is below 95%")
        elif seller.rating >= 99:
            reasons.append(f"Excellent seller feedback ({seller.rating}%)")

    if seller.review_count is not None:
        if seller.review_count < 10:
            score -= 15
            reasons.append(f"Only {seller.review_count} reviews")
        elif seller.review_count >= 100:
            score = min(100.0, score + 5)
            reasons.append(f"Established seller ({seller.review_count} reviews)")

    if seller.verified:
        score = min(100.0, score + 5)
        reasons.append("Verified seller")

    return max(0.0, min(100.0, score)), reasons


def _price_reasonableness_score(
    listing: UnifiedListing, median: float | None
) -> tuple[float, list[str]]:
    reasons: list[str] = []
    if listing.price is None or listing.price <= 0:
        reasons.append("No price listed")
        return 35.0, reasons

    if median is None:
        return 60.0, reasons

    ratio = listing.price / median
    if ratio < 0.4:
        reasons.append(f"Price ${listing.price:.0f} is far below median ${median:.0f}")
        return 20.0, reasons
    if ratio < 0.7:
        reasons.append(f"Price ${listing.price:.0f} is well below median ${median:.0f}")
        return 45.0, reasons
    if ratio <= 1.3:
        reasons.append("Price is near market median")
        return 80.0, reasons
    reasons.append(f"Price ${listing.price:.0f} is above median ${median:.0f}")
    return 65.0, reasons


def _listing_completeness_score(listing: UnifiedListing) -> tuple[float, list[str]]:
    reasons: list[str] = []
    score = 40.0

    if listing.image_urls:
        score += 25
        reasons.append(f"{len(listing.image_urls)} photo(s)")
    else:
        reasons.append("No photos")

    desc_len = len(listing.description or "")
    if desc_len > 100:
        score += 20
        reasons.append("Detailed description")
    elif desc_len > 20:
        score += 10
    else:
        reasons.append("Very short description")

    if listing.condition:
        score += 10
        reasons.append(f"Condition stated: {listing.condition}")

    if listing.location:
        score += 5

    return min(100.0, score), reasons


def _scam_signals(listing: UnifiedListing, median: float | None) -> tuple[float, ScamRisk, list[str]]:
    reasons: list[str] = []
    penalty = 0.0
    text = f"{listing.title} {listing.description}".lower()

    for keyword in SCAM_KEYWORDS:
        if keyword in text:
            penalty += 25
            reasons.append(f"Suspicious phrase: '{keyword}'")

    if URGENCY_PATTERN.search(text):
        penalty += 10
        reasons.append("Urgency language detected")

    if not listing.image_urls:
        penalty += 5

    if listing.price and median and listing.price < median * 0.35:
        penalty += 20
        reasons.append("Unusually low price for this search")

    if listing.source.value == "ebay" and listing.seller.rating is not None and listing.seller.rating < 90:
        penalty += 15
        reasons.append("Low eBay seller rating")

    penalty = min(100.0, penalty)
    if penalty >= 50:
        risk = ScamRisk.HIGH
    elif penalty >= 25:
        risk = ScamRisk.MEDIUM
    else:
        risk = ScamRisk.LOW

    return penalty, risk, reasons


def score_listing_rules(listing: UnifiedListing, median: float | None) -> ListingScores:
    seller_score, seller_reasons = _seller_reputation_score(listing)
    price_score, price_reasons = _price_reasonableness_score(listing, median)
    completeness_score, completeness_reasons = _listing_completeness_score(listing)
    scam_penalty, scam_risk, scam_reasons = _scam_signals(listing, median)

    reliability = (
        seller_score * 0.35
        + price_score * 0.25
        + completeness_score * 0.20
        + max(0.0, 100.0 - scam_penalty) * 0.20
    )

    all_reasons = seller_reasons + price_reasons + completeness_reasons + scam_reasons

    return ListingScores(
        reliability_score=round(reliability, 1),
        scam_risk=scam_risk,
        reasons=all_reasons[:8],
        seller_reputation=round(seller_score, 1),
        price_reasonableness=round(price_score, 1),
        listing_completeness=round(completeness_score, 1),
        scam_penalty=round(scam_penalty, 1),
    )


async def _llm_enrich_batch(listings: list[UnifiedListing]) -> dict[str, dict[str, Any]]:
    settings = get_settings()
    if not settings.openai_api_key and not settings.anthropic_api_key:
        return {}

    payload = [
        {
            "id": l.id,
            "title": l.title,
            "description": l.description[:500],
            "price": l.price,
            "source": l.source.value,
            "seller_rating": l.seller.rating,
            "seller_reviews": l.seller.review_count,
        }
        for l in listings
    ]

    prompt = (
        "Analyze these marketplace listings for scam risk and reliability. "
        'Return JSON object with key "listings" containing an array of objects: '
        '{"id": "...", "scam_risk": "low|medium|high", "reliability_score": 0-100, "reasons": ["..."]}. '
        f"Listings: {json.dumps(payload)}"
    )

    try:
        if settings.openai_api_key:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.openai_api_key)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a marketplace fraud analyst. Respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content or "{}"
            data = json.loads(content)
            items = data if isinstance(data, list) else data.get("listings", data.get("results", []))
        else:
            return {}
    except Exception:
        return {}

    result: dict[str, dict[str, Any]] = {}
    if isinstance(items, list):
        for item in items:
            if "id" in item:
                result[item["id"]] = item
    return result


async def score_listings(listings: list[UnifiedListing]) -> list[UnifiedListing]:
    median = _median_price(listings)
    scored: list[UnifiedListing] = []

    for listing in listings:
        listing.scores = score_listing_rules(listing, median)
        scored.append(listing)

    batch_size = 10
    for i in range(0, len(scored), batch_size):
        batch = scored[i : i + batch_size]
        llm_results = await _llm_enrich_batch(batch)
        for listing in batch:
            llm = llm_results.get(listing.id)
            if not llm:
                continue
            try:
                llm_risk = ScamRisk(llm.get("scam_risk", listing.scores.scam_risk.value))
            except ValueError:
                llm_risk = listing.scores.scam_risk

            llm_score = float(llm.get("reliability_score", listing.scores.reliability_score))
            llm_reasons = llm.get("reasons", [])

            listing.scores.reliability_score = round(
                listing.scores.reliability_score * 0.6 + llm_score * 0.4, 1
            )
            risk_order = {"low": 0, "medium": 1, "high": 2}
            if risk_order[llm_risk.value] > risk_order[listing.scores.scam_risk.value]:
                listing.scores.scam_risk = llm_risk
            for reason in llm_reasons[:3]:
                if reason not in listing.scores.reasons:
                    listing.scores.reasons.append(reason)

    return scored

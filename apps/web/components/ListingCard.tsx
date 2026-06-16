"use client";

import type { UnifiedListing } from "@/lib/types";

interface ListingCardProps {
  listing: UnifiedListing;
  selected: boolean;
  onSelect: (listing: UnifiedListing) => void;
}

function reliabilityColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function reliabilityRing(score: number): string {
  if (score >= 75) return "border-emerald-500";
  if (score >= 50) return "border-amber-500";
  return "border-red-500";
}

export function ListingCard({ listing, selected, onSelect }: ListingCardProps) {
  const image = listing.image_urls[0];
  const score = listing.scores.reliability_score;
  const isScam = listing.scores.scam_risk !== "low";

  return (
    <button
      type="button"
      onClick={() => onSelect(listing)}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:shadow-md dark:bg-zinc-900 ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">No image</div>
        )}
        {isScam && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            Scam risk: {listing.scores.scam_risk}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-medium capitalize text-white">
          {listing.source}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold leading-snug">{listing.title}</h3>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 text-sm font-bold ${reliabilityRing(score)} ${reliabilityColor(score)}`}
          >
            {Math.round(score)}
          </div>
        </div>

        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
          {listing.price != null ? `$${listing.price.toLocaleString()}` : "Price not listed"}
        </p>

        <p className="text-sm text-zinc-500">
          {listing.location || "Location unknown"}
          {listing.distance_miles != null && ` · ${listing.distance_miles} mi`}
        </p>
      </div>
    </button>
  );
}

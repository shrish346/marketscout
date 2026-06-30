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
      className={`lift animate-fade-in-up group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm hover:shadow-xl hover:shadow-blue-900/10 ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-blue-100"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
        )}
        {isScam && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            Scam risk: {listing.scores.scam_risk}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-blue-900/85 px-2.5 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
          {listing.source}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900">{listing.title}</h3>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 text-sm font-bold ${reliabilityRing(score)} ${reliabilityColor(score)}`}
          >
            {Math.round(score)}
          </div>
        </div>

        <p className="text-lg font-bold text-blue-700">
          {listing.price != null ? `$${listing.price.toLocaleString()}` : "Price not listed"}
        </p>

        <p className="text-sm text-slate-500">
          {listing.location || "Location unknown"}
          {listing.distance_miles != null && ` · ${listing.distance_miles} mi`}
        </p>
      </div>
    </button>
  );
}

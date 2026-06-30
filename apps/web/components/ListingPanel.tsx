"use client";

import type { UnifiedListing } from "@/lib/types";

interface ListingPanelProps {
  listing: UnifiedListing | null;
  onClose: () => void;
}

export function ListingPanel({ listing, onClose }: ListingPanelProps) {
  if (!listing) return null;

  const isScam = listing.scores.scam_risk !== "low";

  return (
    <div
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex justify-end bg-blue-950/30 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-right flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-blue-100"
      >
        <div className="flex items-center justify-between border-b border-blue-100 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Listing details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {listing.image_urls[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="mb-4 w-full rounded-xl object-cover"
            />
          )}

          <h3 className="text-xl font-bold text-slate-900">{listing.title}</h3>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {listing.price != null ? `$${listing.price.toLocaleString()}` : "Price not listed"}
          </p>

          {isScam && (
            <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Scam warning ({listing.scores.scam_risk} risk)</p>
              <p className="mt-1 text-sm">Exercise caution before contacting this seller.</p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="font-semibold text-slate-900">
              Reliability score: {listing.scores.reliability_score}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-600">Why this score?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {listing.scores.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-sm text-slate-600">{listing.description}</p>

          {listing.seller.name && (
            <p className="mt-4 text-sm text-slate-700">
              Seller: <span className="font-medium">{listing.seller.name}</span>
              {listing.seller.rating != null && ` · ${listing.seller.rating}% positive`}
              {listing.seller.review_count != null && ` · ${listing.seller.review_count} reviews`}
            </p>
          )}

          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-600 hover:to-blue-500 active:scale-[0.98]"
          >
            View on {listing.source}
          </a>
        </div>
      </div>
    </div>
  );
}

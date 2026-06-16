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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-4">
      <div className="flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Listing details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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

          <h3 className="text-xl font-bold">{listing.title}</h3>
          <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {listing.price != null ? `$${listing.price.toLocaleString()}` : "Price not listed"}
          </p>

          {isScam && (
            <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <p className="font-semibold">Scam warning ({listing.scores.scam_risk} risk)</p>
              <p className="mt-1 text-sm">Exercise caution before contacting this seller.</p>
            </div>
          )}

          <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <p className="font-semibold">Reliability score: {listing.scores.reliability_score}</p>
            <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">Why this score?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              {listing.scores.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{listing.description}</p>

          {listing.seller.name && (
            <p className="mt-4 text-sm">
              Seller: <span className="font-medium">{listing.seller.name}</span>
              {listing.seller.rating != null && ` · ${listing.seller.rating}% positive`}
              {listing.seller.review_count != null && ` · ${listing.seller.review_count} reviews`}
            </p>
          )}

          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500"
          >
            View on {listing.source}
          </a>
        </div>
      </div>
    </div>
  );
}

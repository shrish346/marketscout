"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AgentProgress } from "@/components/AgentProgress";
import { ListingCard } from "@/components/ListingCard";
import { ListingPanel } from "@/components/ListingPanel";
import { SearchBar } from "@/components/SearchBar";
import { SortFilter } from "@/components/SortFilter";
import { startSearch, subscribeToSearch } from "@/lib/api";
import type { SearchEvent, SortOption, SourceName, UnifiedListing } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { filterAndSortListings, loadSettings } from "@/lib/utils";

type SourceStatus = {
  state: "idle" | "running" | "done" | "error";
  count: number;
  error?: string;
};

const INITIAL_STATUS: Record<SourceName, SourceStatus> = {
  craigslist: { state: "idle", count: 0 },
  ebay: { state: "idle", count: 0 },
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [zipCode, setZipCode] = useState(DEFAULT_SETTINGS.defaultZip);
  const [radius, setRadius] = useState(DEFAULT_SETTINGS.defaultRadius);
  const [sources, setSources] = useState<SourceName[]>(DEFAULT_SETTINGS.sources);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [selected, setSelected] = useState<UnifiedListing | null>(null);
  const [agentStatus, setAgentStatus] = useState(INITIAL_STATUS);
  const [sort, setSort] = useState<SortOption>("reliability");
  const [hideHighScamRisk, setHideHighScamRisk] = useState(false);
  const [minReliability, setMinReliability] = useState(0);
  const [searchComplete, setSearchComplete] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const teardownStream = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Close any open stream when the page unmounts.
  useEffect(() => teardownStream, [teardownStream]);

  useEffect(() => {
    const settings = loadSettings();
    setZipCode(settings.defaultZip);
    setRadius(settings.defaultRadius);
    setSources(settings.sources);
    setHideHighScamRisk(settings.hideHighScamRisk);
    setMinReliability(settings.minReliability);
  }, []);

  const handleEvent = useCallback((event: SearchEvent) => {
    if (event.source) {
      setAgentStatus((prev) => {
        const next = { ...prev };
        if (event.type === "source_started") {
          next[event.source!] = { state: "running", count: 0 };
        } else if (event.type === "source_done") {
          next[event.source!] = { state: "done", count: event.count ?? 0 };
        } else if (event.type === "source_error") {
          next[event.source!] = { state: "error", count: 0, error: event.error };
        }
        return next;
      });
    }

    if (event.type === "listing_scored" && event.listing) {
      setListings((prev) => {
        const exists = prev.findIndex((l) => l.id === event.listing!.id);
        if (exists >= 0) {
          const copy = [...prev];
          copy[exists] = event.listing!;
          return copy;
        }
        return [...prev, event.listing!];
      });
    }

    if (event.type === "search_complete") {
      setLoading(false);
      setSearchComplete(true);
      if (event.error) {
        setError(event.message || event.error);
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim() || sources.length === 0) return;

    // Tear down any stream still running from a previous search.
    teardownStream();

    setLoading(true);
    setError(null);
    setListings([]);
    setSelected(null);
    setSearchComplete(false);
    setAgentStatus(INITIAL_STATUS);

    try {
      const searchId = await startSearch({
        query: query.trim(),
        zip_code: zipCode,
        radius_miles: radius,
        sources,
      });

      unsubscribeRef.current = subscribeToSearch(
        searchId,
        handleEvent,
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

      timeoutRef.current = setTimeout(() => teardownStream(), 120000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setLoading(false);
    }
  };

  const displayed = useMemo(
    () => filterAndSortListings(listings, sort, hideHighScamRisk, minReliability),
    [listings, sort, hideHighScamRisk, minReliability]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MarketScout</h1>
            <p className="text-sm text-zinc-500">Unified search across messy marketplaces</p>
          </div>
          <Link
            href="/settings"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Settings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <SearchBar
          query={query}
          zipCode={zipCode}
          radius={radius}
          sources={sources}
          loading={loading}
          onQueryChange={setQuery}
          onZipChange={setZipCode}
          onRadiusChange={setRadius}
          onSourcesChange={setSources}
          onSearch={handleSearch}
        />

        <AgentProgress status={agentStatus} />

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {(listings.length > 0 || searchComplete) && (
          <SortFilter
            sort={sort}
            hideHighScamRisk={hideHighScamRisk}
            minReliability={minReliability}
            resultCount={displayed.length}
            onSortChange={setSort}
            onHideHighScamRiskChange={setHideHighScamRisk}
            onMinReliabilityChange={setMinReliability}
          />
        )}

        {searchComplete && displayed.length === 0 && !error && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            No listings matched your filters. Try broadening your search or adjusting filters.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              selected={selected?.id === listing.id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </main>

      <ListingPanel listing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

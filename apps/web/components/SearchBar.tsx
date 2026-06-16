"use client";

import type { SourceName } from "@/lib/types";

interface SearchBarProps {
  query: string;
  zipCode: string;
  radius: number;
  sources: SourceName[];
  loading: boolean;
  onQueryChange: (value: string) => void;
  onZipChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onSourcesChange: (sources: SourceName[]) => void;
  onSearch: () => void;
}

const SOURCE_OPTIONS: { id: SourceName; label: string }[] = [
  { id: "craigslist", label: "Craigslist" },
  { id: "ebay", label: "eBay" },
];

export function SearchBar({
  query,
  zipCode,
  radius,
  sources,
  loading,
  onQueryChange,
  onZipChange,
  onRadiusChange,
  onSourcesChange,
  onSearch,
}: SearchBarProps) {
  const toggleSource = (source: SourceName) => {
    if (sources.includes(source)) {
      onSourcesChange(sources.filter((s) => s !== source));
    } else {
      onSourcesChange([...sources, source]);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 lg:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder='Search listings, e.g. "e bike"'
          className="flex-1 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-lg outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={loading || !query.trim() || sources.length === 0}
          className="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">Zip code</span>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => onZipChange(e.target.value)}
            maxLength={5}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">
            Radius: {radius} miles
          </span>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="accent-emerald-600"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {SOURCE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            <input
              type="checkbox"
              checked={sources.includes(option.id)}
              onChange={() => toggleSource(option.id)}
              className="accent-emerald-600"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

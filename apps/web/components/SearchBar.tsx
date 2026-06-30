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
    <div className="animate-fade-in-up rounded-2xl border border-blue-100 bg-white p-6 shadow-sm shadow-blue-900/5">
      <div className="flex flex-col gap-4 lg:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder='Search listings, e.g. "e bike"'
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={loading || !query.trim() || sources.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-600 hover:to-blue-500 hover:shadow-blue-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-blue-600/20"
        >
          {loading && <span className="spinner" />}
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Zip code</span>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => onZipChange(e.target.value)}
            maxLength={5}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-600">
            Radius: {radius} miles
          </span>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="accent-blue-600"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {SOURCE_OPTIONS.map((option) => {
          const active = sources.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                active
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleSource(option.id)}
                className="accent-blue-600"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

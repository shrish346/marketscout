"use client";

import type { SortOption } from "@/lib/types";

interface SortFilterProps {
  sort: SortOption;
  hideHighScamRisk: boolean;
  minReliability: number;
  resultCount: number;
  onSortChange: (sort: SortOption) => void;
  onHideHighScamRiskChange: (value: boolean) => void;
  onMinReliabilityChange: (value: number) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "reliability", label: "Reliability" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Distance" },
  { value: "newest", label: "Newest" },
];

export function SortFilter({
  sort,
  hideHighScamRisk,
  minReliability,
  resultCount,
  onSortChange,
  onHideHighScamRiskChange,
  onMinReliabilityChange,
}: SortFilterProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{resultCount} results</p>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hideHighScamRisk}
            onChange={(e) => onHideHighScamRiskChange(e.target.checked)}
            className="accent-emerald-600"
          />
          Hide high scam risk
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span>Min reliability: {minReliability}</span>
          <input
            type="range"
            min={0}
            max={90}
            step={10}
            value={minReliability}
            onChange={(e) => onMinReliabilityChange(Number(e.target.value))}
            className="accent-emerald-600"
          />
        </label>
      </div>
    </div>
  );
}

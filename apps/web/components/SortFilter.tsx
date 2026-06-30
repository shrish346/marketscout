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
    <div className="animate-fade-in flex flex-col gap-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-medium text-slate-600">
        <span className="text-blue-700">{resultCount}</span> results
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={hideHighScamRisk}
            onChange={(e) => onHideHighScamRiskChange(e.target.checked)}
            className="accent-blue-600"
          />
          Hide high scam risk
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>Min reliability: {minReliability}</span>
          <input
            type="range"
            min={0}
            max={90}
            step={10}
            value={minReliability}
            onChange={(e) => onMinReliabilityChange(Number(e.target.value))}
            className="accent-blue-600"
          />
        </label>
      </div>
    </div>
  );
}

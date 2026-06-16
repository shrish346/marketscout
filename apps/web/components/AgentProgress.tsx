"use client";

import type { SourceName } from "@/lib/types";

interface AgentProgressProps {
  status: Record<SourceName, { state: "idle" | "running" | "done" | "error"; count: number; error?: string }>;
}

const LABELS: Record<SourceName, string> = {
  craigslist: "Craigslist",
  ebay: "eBay",
};

export function AgentProgress({ status }: AgentProgressProps) {
  const entries = Object.entries(status) as [SourceName, AgentProgressProps["status"][SourceName]][];

  if (entries.every(([, s]) => s.state === "idle")) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Agent progress</p>
      <div className="flex flex-wrap gap-3">
        {entries.map(([source, info]) => (
          <div
            key={source}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-zinc-800"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                info.state === "running"
                  ? "animate-pulse bg-amber-400"
                  : info.state === "done"
                    ? "bg-emerald-500"
                    : info.state === "error"
                      ? "bg-red-500"
                      : "bg-zinc-300"
              }`}
            />
            <span className="font-medium">{LABELS[source]}</span>
            <span className="text-zinc-500">
              {info.state === "running" && "Searching..."}
              {info.state === "done" && `${info.count} found`}
              {info.state === "error" && (info.error || "Failed")}
              {info.state === "idle" && "Waiting"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

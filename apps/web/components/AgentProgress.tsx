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
    <div className="animate-fade-in-up rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-600">Agent progress</p>
      <div className="flex flex-wrap gap-3">
        {entries.map(([source, info]) => (
          <div
            key={source}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-blue-100 transition-all"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                info.state === "running"
                  ? "animate-pulse bg-sky-400 ring-4 ring-sky-400/20"
                  : info.state === "done"
                    ? "bg-emerald-500"
                    : info.state === "error"
                      ? "bg-red-500"
                      : "bg-slate-300"
              }`}
            />
            <span className="font-medium text-slate-700">{LABELS[source]}</span>
            <span className="text-slate-500">
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

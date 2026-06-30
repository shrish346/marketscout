"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SourceName, UserSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const toggleSource = (source: SourceName) => {
    setSettings((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="bg-gradient-to-r from-blue-900 to-sky-500 bg-clip-text text-xl font-bold text-transparent">
            Settings
          </h1>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
            Back to search
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Default location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Zip code
              <input
                type="text"
                value={settings.defaultZip}
                onChange={(e) => setSettings({ ...settings, defaultZip: e.target.value })}
                maxLength={5}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Default radius: {settings.defaultRadius} mi
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={settings.defaultRadius}
                onChange={(e) =>
                  setSettings({ ...settings, defaultRadius: Number(e.target.value) })
                }
                className="accent-blue-600"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Default sources</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {(["craigslist", "ebay"] as SourceName[]).map((source) => (
              <label
                key={source}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm capitalize text-slate-600 transition-all hover:border-blue-300 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={settings.sources.includes(source)}
                  onChange={() => toggleSource(source)}
                  className="accent-blue-600"
                />
                {source}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Default filters</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.hideHighScamRisk}
                onChange={(e) =>
                  setSettings({ ...settings, hideHighScamRisk: e.target.checked })
                }
                className="accent-blue-600"
              />
              Hide high scam risk by default
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Minimum reliability: {settings.minReliability}
              <input
                type="range"
                min={0}
                max={90}
                step={10}
                value={settings.minReliability}
                onChange={(e) =>
                  setSettings({ ...settings, minReliability: Number(e.target.value) })
                }
                className="accent-blue-600"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 text-sm text-slate-600">
          <h2 className="font-semibold text-slate-900">API credentials</h2>
          <p className="mt-2">
            eBay and OpenAI keys are configured server-side in the project root{" "}
            <code className="rounded bg-blue-100 px-1 text-blue-900">.env</code> file — not in
            the browser.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <code>EBAY_CLIENT_ID</code> and <code>EBAY_CLIENT_SECRET</code>
            </li>
            <li>
              <code>OPENAI_API_KEY</code> (optional, for AI scam analysis)
            </li>
          </ul>
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-600 hover:to-blue-500 active:scale-[0.98]"
        >
          {saved ? "Saved!" : "Save settings"}
        </button>
      </main>
    </div>
  );
}

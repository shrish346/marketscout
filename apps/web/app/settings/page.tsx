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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Settings</h1>
          <Link href="/" className="text-sm text-emerald-600 hover:underline">
            Back to search
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Default location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Zip code
              <input
                type="text"
                value={settings.defaultZip}
                onChange={(e) => setSettings({ ...settings, defaultZip: e.target.value })}
                maxLength={5}
                className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
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
                className="accent-emerald-600"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Default sources</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {(["craigslist", "ebay"] as SourceName[]).map((source) => (
              <label
                key={source}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm capitalize dark:border-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={settings.sources.includes(source)}
                  onChange={() => toggleSource(source)}
                  className="accent-emerald-600"
                />
                {source}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Default filters</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.hideHighScamRisk}
                onChange={(e) =>
                  setSettings({ ...settings, hideHighScamRisk: e.target.checked })
                }
                className="accent-emerald-600"
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
                className="accent-emerald-600"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">API credentials</h2>
          <p className="mt-2">
            eBay and OpenAI keys are configured server-side in the project root{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">.env</code> file — not in
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
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500"
        >
          {saved ? "Saved!" : "Save settings"}
        </button>
      </main>
    </div>
  );
}

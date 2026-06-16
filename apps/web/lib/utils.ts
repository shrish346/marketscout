import { DEFAULT_SETTINGS, type SortOption, type UnifiedListing, type UserSettings } from "./types";

export function filterAndSortListings(
  listings: UnifiedListing[],
  sort: SortOption,
  hideHighScamRisk: boolean,
  minReliability: number
): UnifiedListing[] {
  let filtered = listings.filter((l) => l.scores.reliability_score >= minReliability);

  if (hideHighScamRisk) {
    filtered = filtered.filter((l) => l.scores.scam_risk !== "high");
  }

  const sorted = [...filtered];

  switch (sort) {
    case "reliability":
      sorted.sort((a, b) => b.scores.reliability_score - a.scores.reliability_score);
      break;
    case "price_asc":
      sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      break;
    case "price_desc":
      sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;
    case "distance":
      sorted.sort(
        (a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity)
      );
      break;
    case "newest":
      sorted.sort((a, b) => {
        const aTime = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const bTime = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return bTime - aTime;
      });
      break;
  }

  return sorted;
}

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = localStorage.getItem("marketscout-settings");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem("marketscout-settings", JSON.stringify(settings));
}

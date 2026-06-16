export type SourceName = "craigslist" | "ebay";
export type ScamRisk = "low" | "medium" | "high";

export interface SellerInfo {
  name: string | null;
  rating: number | null;
  review_count: number | null;
  verified: boolean;
  account_age_days: number | null;
}

export interface ListingScores {
  reliability_score: number;
  scam_risk: ScamRisk;
  reasons: string[];
  seller_reputation: number;
  price_reasonableness: number;
  listing_completeness: number;
  scam_penalty: number;
}

export interface UnifiedListing {
  id: string;
  source: SourceName;
  title: string;
  price: number | null;
  currency: string;
  location: string;
  distance_miles: number | null;
  image_urls: string[];
  listing_url: string;
  description: string;
  posted_at: string | null;
  seller: SellerInfo;
  condition: string | null;
  shipping_cost: number | null;
  scores: ListingScores;
}

export interface SearchRequest {
  query: string;
  zip_code: string;
  radius_miles: number;
  sources: SourceName[];
}

export type SearchEventType =
  | "source_started"
  | "source_done"
  | "source_error"
  | "listing_found"
  | "listing_scored"
  | "search_complete";

export interface SearchEvent {
  type: SearchEventType;
  search_id: string;
  source?: SourceName;
  listing?: UnifiedListing;
  message?: string;
  count?: number;
  error?: string;
}

export type SortOption =
  | "reliability"
  | "price_asc"
  | "price_desc"
  | "distance"
  | "newest";

export interface UserSettings {
  defaultZip: string;
  defaultRadius: number;
  sources: SourceName[];
  hideHighScamRisk: boolean;
  minReliability: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultZip: "94102",
  defaultRadius: 25,
  sources: ["craigslist", "ebay"],
  hideHighScamRisk: false,
  minReliability: 0,
};

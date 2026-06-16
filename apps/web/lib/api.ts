import type { SearchEvent, SearchRequest, UnifiedListing } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function startSearch(request: SearchRequest): Promise<string> {
  const response = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to start search");
  }

  const data = await response.json();
  return data.search_id as string;
}

export function subscribeToSearch(
  searchId: string,
  onEvent: (event: SearchEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const source = new EventSource(`${API_BASE}/api/search/${searchId}/stream`);

  source.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data) as SearchEvent;
      onEvent(event);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Invalid event"));
    }
  };

  source.onerror = () => {
    onError?.(new Error("Connection lost"));
    source.close();
  };

  return () => source.close();
}

export async function fetchResults(searchId: string): Promise<UnifiedListing[]> {
  const response = await fetch(`${API_BASE}/api/search/${searchId}/results`);
  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }
  const data = await response.json();
  return data.listings as UnifiedListing[];
}

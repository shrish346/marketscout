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
  let closed = false;

  const close = () => {
    closed = true;
    source.close();
  };

  source.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data) as SearchEvent;
      onEvent(event);
      // The server ends the stream after search_complete; close from the
      // client side so EventSource doesn't treat the normal close as an
      // error and try to reconnect.
      if (event.type === "search_complete") {
        close();
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Invalid event"));
    }
  };

  source.onerror = () => {
    if (closed) return;
    onError?.(new Error("Connection lost"));
    close();
  };

  return close;
}

export async function fetchResults(searchId: string): Promise<UnifiedListing[]> {
  const response = await fetch(`${API_BASE}/api/search/${searchId}/results`);
  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }
  const data = await response.json();
  return data.listings as UnifiedListing[];
}

const HARVEY_API_BASE_URL = import.meta.env.VITE_HARVEY_URL ?? 'http://localhost:8086';

export interface ApiChatRequest {
  question: string;
  datasheet_url?: string;
  datasheet_urls?: string[];
  datasheet_yaml?: string;
  datasheet_yamls?: string[];
}

export interface ApiChatResponse {
  answer: string;
  plan?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export async function chatWithApiAgent(body: ApiChatRequest): Promise<ApiChatResponse> {
  const response = await fetch(`${HARVEY_API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `API returned ${response.status}`;
    try {
      const detail = await response.json();
      if (typeof detail?.detail === 'string') message = detail.detail;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return response.json();
}

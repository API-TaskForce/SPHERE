export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  // Generated chart HTML (rendered in an iframe) when available.
  chartHtml?: string;
  // A chart could be produced for this answer but was not generated yet (ask mode).
  chartAvailable?: boolean;
  // Request to re-run (with force_chart) to actually generate the chart on demand.
  pendingChartRequest?: ChatRequest;
  // The on-demand generation ran but produced no chart.
  chartError?: boolean;
  metadata?: {
    plan?: Record<string, unknown>;
    result?: Record<string, unknown>;
  };
}

export type Origins = 'user' | 'preset' | 'agent' | 'sphere';

export type DatasheetContextItem = BaseDatasheetContextItem | SphereDatasheetContextItem;

export type DatasheetContextInput = BaseDatasheetContextInput | SphereDatasheetContextInput;

export interface BaseDatasheetContextInput {
  kind: 'yaml';
  label: string;
  value: string;
  // 'sphere' is reserved for SphereDatasheetContextInput so `origin` discriminates the union.
  origin?: 'user' | 'preset' | 'agent';
}

export interface SphereDatasheetContextInput {
  kind: 'yaml';
  label: string;
  value: string;
  origin: 'sphere';
  sphereId: string;
  owner: string;
  collection: string | null;
  datasheetName: string;
  version: string;
  yamlPath: string;
}

export type BaseDatasheetContextItem = BaseDatasheetContextInput & { id: string };
export type SphereDatasheetContextItem = SphereDatasheetContextInput & { id: string };

export interface PromptPreset {
  id: string;
  label: string;
  description: string;
  question: string;
  context: PresetContextInput[];
}

export interface PresetContextInput {
  kind: 'yaml';
  label: string;
  value: string;
}

export type ChatRequest = {
  question: string;
  history?: Array<{ role: string; content: string }>;
  force_chart?: boolean;
} & DatasheetContextPayload;

export interface DatasheetContextPayload {
  datasheet_yaml?: string;
  datasheet_yamls?: string[];
}

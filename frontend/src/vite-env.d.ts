/// <reference types="vite/client" />

declare module "*.md";

interface ImportMetaEnv {
  readonly VITE_CHARTS_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
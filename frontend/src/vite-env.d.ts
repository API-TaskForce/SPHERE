/// <reference types="vite/client" />

declare module "*.md";

declare module "*.html?raw" {
  const content: string;
  export default content;
}
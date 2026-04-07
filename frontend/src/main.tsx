import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { SpaceProvider } from "space-react-client";
import LoadingView from "./modules/core/pages/loading";

const spaceConfig = {
  url: import.meta.env.VITE_SPACE_URL || 'http://localhost:5403',
  apiKey: import.meta.env.VITE_SPACE_API_KEY || '',
  allowConnectionWithSpace: true,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpaceProvider config={spaceConfig}>
      <BrowserRouter>
        <Suspense fallback={<LoadingView />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </SpaceProvider>
  </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ConfigMissing } from "./components/ConfigMissing";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { isSupabaseConfigured } from "./lib/supabase";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      {isSupabaseConfigured ? (
        <AuthProvider>
          <App />
        </AuthProvider>
      ) : (
        <ConfigMissing />
      )}
    </ErrorBoundary>
  </StrictMode>,
);

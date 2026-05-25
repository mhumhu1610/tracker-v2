import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ConfigMissing } from "./components/ConfigMissing";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { isConfigReady, loadRuntimeConfig } from "./lib/config";
import "./index.css";

function Bootstrap() {
  const [ready, setReady] = useState(isConfigReady);
  const [checking, setChecking] = useState(!isConfigReady);

  useEffect(() => {
    if (isConfigReady()) {
      setReady(true);
      setChecking(false);
      return;
    }

    loadRuntimeConfig().then((ok) => {
      setReady(ok);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!ready) {
    return <ConfigMissing />;
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <Bootstrap />
    </ErrorBoundary>
  </StrictMode>,
);

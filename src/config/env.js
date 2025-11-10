// Environment configuration utility
// Supports both build-time (import.meta.env) and runtime (window.ENV) variables

const getEnvVar = (key) => {
  // First try runtime config (for K8s deployments)
  if (window.ENV && window.ENV[key] && !window.ENV[key].startsWith("__")) {
    return window.ENV[key];
  }

  // Fallback to build-time config (for local development)
  return import.meta.env[key] || "";
};

export const ENV = {
  API_URL: getEnvVar("VITE_API_URL"),
  WS_URL: getEnvVar("VITE_WS_URL"),
  ADMIN_KEY: getEnvVar("VITE_ADMIN_API_KEY"),
  USE_MOCK: getEnvVar("VITE_USE_MOCK") === "true",
};

// Backwards compatibility for legacy flag consumers
ENV.USE_MONITORING_MOCKS = ENV.USE_MOCK;

// Debug logging in development
if (import.meta.env.DEV) {
  console.log("Environment Config:", {
    API_URL: ENV.API_URL,
    WS_URL: ENV.WS_URL,
    ADMIN_KEY: ENV.ADMIN_KEY,
    USE_MOCK: ENV.USE_MOCK,
    source: window.ENV?.VITE_API_URL?.startsWith("__")
      ? "build-time"
      : "runtime",
  });
}

if (ENV.USE_MOCK) {
  console.info("[Mock Mode Enabled] Monitoring will use mock data sources.");
} else {
  console.info("[Real Mode Enabled] Monitoring will use live data sources.");
}

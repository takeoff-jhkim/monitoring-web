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
  USE_MONITORING_MOCKS: (() => {
    const value = getEnvVar("VITE_USE_MONITORING_MOCKS");
    if (typeof value === "boolean") return value;
    if (!value) return false;
    const normalized = value.toString().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  })(),
};

// Debug logging in development
if (import.meta.env.DEV) {
  console.log("Environment Config:", {
    API_URL: ENV.API_URL,
    WS_URL: ENV.WS_URL,
    ADMIN_KEY: ENV.ADMIN_KEY,
    USE_MONITORING_MOCKS: ENV.USE_MONITORING_MOCKS,
    source: window.ENV?.VITE_API_URL?.startsWith("__")
      ? "build-time"
      : "runtime",
  });
}

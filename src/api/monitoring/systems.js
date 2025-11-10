import { apiClient } from "../client";
import { SYSTEM_DEFINITIONS } from "../../config/systems";
import { ENV } from "../../config/env";

const normalizeSystem = (system) => {
  if (!system) return null;
  const apiKeyRaw = system.api_key || system.apiKey;
  const apiKey = apiKeyRaw ? String(apiKeyRaw) : null;
  if (!apiKey) return null;

  const definition = SYSTEM_DEFINITIONS.find(
    (entry) => entry.apiKey === apiKey,
  );

  const coalesce = (value, fallback) =>
    value === undefined || value === null || value === ""
      ? fallback
      : value;

  return {
    apiKey,
    systemName:
      coalesce(system.system_name, null) ??
      coalesce(system.systemName, null) ??
      definition?.name ??
      apiKey,
    environment:
      coalesce(system.environment, null) ?? definition?.environment ?? null,
    organizationId:
      coalesce(system.organization_id, null) ??
      coalesce(system.organizationId, null) ??
      definition?.owner ??
      null,
    registeredAt:
      coalesce(system.registered_at, null) ??
      coalesce(system.registeredAt, null) ??
      null,
    lastSeenAt:
      coalesce(system.last_seen_at, null) ??
      coalesce(system.lastSeenAt, null) ??
      null,
    status: coalesce(system.status, null) ?? null,
    healthStatus:
      coalesce(system.health_status, null) ??
      coalesce(system.healthStatus, null) ??
      null,
    description:
      coalesce(system.description, null) ?? definition?.description ?? null,
    region: coalesce(system.region, null) ?? definition?.region ?? null,
    model: coalesce(system.model, null) ?? definition?.model ?? null,
    tags: coalesce(system.tags, null) ?? definition?.tags ?? [],
    id: coalesce(system.id, null) ?? apiKey,
  };
};

const extractSystems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.systems)) return payload.systems;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
};

const buildMockSystems = () => {
  const now = Date.now();
  return SYSTEM_DEFINITIONS.map((definition, index) => ({
    apiKey: definition.apiKey,
    systemName: definition.name,
    environment: definition.environment,
    organizationId: definition.owner,
    registeredAt: new Date(now - (index + 1) * 86400000).toISOString(),
    lastSeenAt: new Date(now - index * 3600000).toISOString(),
    status: "ACTIVE",
    healthStatus: "UNKNOWN",
    description: definition.description,
    region: definition.region,
    model: definition.model,
    tags: definition.tags,
    id: definition.apiKey,
  }));
};

export const systemsApi = {
  async getSystemList(page = 0, size = 20) {
    if (ENV.USE_MOCK) {
      return {
        systems: buildMockSystems(),
        page,
        size,
        total: SYSTEM_DEFINITIONS.length,
        isMock: true,
        error: null,
      };
    }

    try {
      const response = await apiClient.get("/api/admin/systems", {
        params: { page, size },
      });
      const payload = response.data ?? {};
      const rawSystems = extractSystems(payload);
      const systems = rawSystems
        .map((system) => normalizeSystem(system))
        .filter((entry) => !!entry);

      return {
        systems,
        page: payload.current_page ?? payload.page ?? page,
        size,
        total: payload.total ?? systems.length,
        isMock: false,
        error: null,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Falling back to mock systems", error);
      }
      return {
        systems: buildMockSystems(),
        page,
        size,
        total: SYSTEM_DEFINITIONS.length,
        isMock: true,
        error,
      };
    }
  },
};

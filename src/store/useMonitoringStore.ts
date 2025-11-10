import { create } from "zustand";

const MAX_HEARTBEATS = 60;
const MAX_EVENTS = 60;
const MAX_AGENT_ENTRIES = 8;

export type MonitoringEvent<T> = {
  ts: string;
  type: "heartbeat" | "status" | "agent_status" | "system_event" | "llm_usage" | string;
  api_key: string;
  data: T;
};

type MetricPoint = {
  timestamp: number;
  value: number;
};

type HeartbeatData = {
  uptime_seconds: number;
  hardware: {
    cpu?: { util_percent?: number; temperature_c?: number };
    memory?: { util_percent?: number };
    storage?: { mount: string; util_percent?: number }[];
  };
};

type SystemStatusData = {
  agent_id?: string;
  status: string;
  last_connected_at?: string;
};

type AgentStatusData = {
  id: string;
  status: string;
  name?: string;
  command?: string;
  userEmail?: string;
  createdAt?: string;
};

type LlmUsageData = {
  mode: string;
  provider: string;
  model_name: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  requestsPerMin?: number;
  tokensPerMin?: number;
  costUsd?: number;
};

type SystemNewData = {
  event: string;
  agent_id: string;
  created_at: string;
};

type DisplayEvent = {
  id: string;
  channel: string;
  type: string;
  level: "info" | "warning" | "error";
  message: string;
  timestamp: number;
};

export type SystemMeta = {
  apiKey: string;
  name?: string;
  description?: string;
  owner?: string;
  environment?: string;
  region?: string;
  model?: string;
  tags?: string[];
  registeredAt?: string | null;
  lastSeenAt?: string | null;
  status?: string | null;
  healthStatus?: string | null;
};

export type SystemListEntry = {
  apiKey: string;
  systemName?: string | null;
  environment?: string | null;
  organizationId?: string | null;
  registeredAt?: string | null;
  lastSeenAt?: string | null;
  status?: string | null;
  healthStatus?: string | null;
  description?: string | null;
  region?: string | null;
  model?: string | null;
  tags?: string[] | null;
};

type SystemBucket = {
  apiKey: string;
  meta: Partial<SystemMeta>;
  heartbeat: { timestamp: number; data: HeartbeatData }[];
  metrics: {
    cpu: MetricPoint[];
    memory: MetricPoint[];
    storage: MetricPoint[];
  };
  status: (SystemStatusData & { timestamp: number }) | null;
  agents: (AgentStatusData & { timestamp: number })[];
  llm: (LlmUsageData & { timestamp: number }) | null;
  events: DisplayEvent[];
  lastHeartbeatTs: number | null;
};

type MonitoringStoreState = {
  byApi: Record<string, SystemBucket>;
  systemList: SystemListEntry[];
  selectedApiKey: string | null;
  registerSystems: (systems: SystemMeta[]) => void;
  ingestHeartbeat: (event: MonitoringEvent<HeartbeatData>) => void;
  ingestSystemStatus: (event: MonitoringEvent<SystemStatusData>) => void;
  ingestAgentStatus: (event: MonitoringEvent<AgentStatusData>) => void;
  ingestLlmUsage: (event: MonitoringEvent<LlmUsageData>) => void;
  ingestSystemEvent: (event: MonitoringEvent<SystemNewData>) => void;
  setAgentList: (apiKey: string, agents: (AgentStatusData & { timestamp?: number })[]) => void;
  setSystemList: (systems: SystemListEntry[]) => void;
  setSelectedApiKey: (apiKey: string | null) => void;
};

type InternalState = MonitoringStoreState;

const trimSeries = <T,>(series: T[], limit: number) =>
  series.length > limit ? series.slice(series.length - limit) : series;

const createBucket = (apiKey: string, meta: Partial<SystemMeta> = {}): SystemBucket => ({
  apiKey,
  meta,
  heartbeat: [],
  metrics: {
    cpu: [],
    memory: [],
    storage: [],
  },
  status: null,
  agents: [],
  llm: null,
  events: [],
  lastHeartbeatTs: null,
});

const ensureBucket = (
  state: InternalState,
  apiKey: string,
  meta: Partial<SystemMeta> = {},
): SystemBucket => {
  const existing = state.byApi[apiKey];
  if (existing) {
    return {
      ...existing,
      meta: { ...existing.meta, ...meta },
    };
  }
  return createBucket(apiKey, meta);
};

const appendEvent = (events: DisplayEvent[], event: DisplayEvent) =>
  [event, ...events].slice(0, MAX_EVENTS);

const toTimestamp = (ts: string) => Number(ts) * 1000;

const levelFromStatus = (status: string): "info" | "warning" | "error" => {
  if (status === "off") return "warning";
  if (status === "rag_building") return "warning";
  if (status === "error" || status === "failed" || status === "incident") {
    return "error";
  }
  return "info";
};

const levelFromAgentStatus = (status: string): "info" | "warning" | "error" => {
  if (status === "error" || status === "failed") return "error";
  if (status === "idle") return "info";
  return "info";
};

export const useMonitoringStore = create<MonitoringStoreState>((set, get) => ({
  byApi: {},
  systemList: [],
  selectedApiKey: null,
  registerSystems: (systems) => {
    if (!systems || systems.length === 0) return;
    set((state) => {
      const next: Record<string, SystemBucket> = { ...state.byApi };
      let mutated = false;
      let listMutated = false;
      let nextList = state.systemList;
      systems.forEach((system) => {
        if (!system.apiKey) return;
        const existing = state.byApi[system.apiKey];
        if (existing) {
          next[system.apiKey] = {
            ...existing,
            meta: { ...existing.meta, ...system },
          };
        } else {
          next[system.apiKey] = createBucket(system.apiKey, system);
        }
        mutated = true;

        const index = state.systemList.findIndex(
          (entry) => entry.apiKey === system.apiKey,
        );
        if (index !== -1) {
          if (!listMutated) {
            nextList = [...state.systemList];
            listMutated = true;
          }
          const current = nextList[index];
          nextList[index] = {
            ...current,
            systemName: system.name ?? current.systemName,
            environment: system.environment ?? current.environment,
            organizationId: system.owner ?? current.organizationId,
            registeredAt: system.registeredAt ?? current.registeredAt,
            lastSeenAt: system.lastSeenAt ?? current.lastSeenAt,
            status: system.status ?? current.status,
            healthStatus: system.healthStatus ?? current.healthStatus,
            description: system.description ?? current.description,
            region: system.region ?? current.region,
            model: system.model ?? current.model,
            tags: system.tags ?? current.tags,
          };
        }
      });
      const result: Partial<MonitoringStoreState> = {};
      if (mutated) result.byApi = next;
      if (listMutated) result.systemList = nextList;
      return mutated || listMutated ? result : state;
    });
  },
  ingestHeartbeat: (event) => {
    const { api_key: apiKey, data, ts } = event;
    if (!apiKey) return;
    const timestamp = toTimestamp(ts);
    set((state) => {
      const bucket = ensureBucket(state, apiKey);
      const cpuValue = data.hardware?.cpu?.util_percent ?? 0;
      const memoryValue = data.hardware?.memory?.util_percent ?? 0;
      const storageEntries = data.hardware?.storage ?? [];
      const storageValue =
        storageEntries.reduce((acc, entry) => acc + (entry.util_percent ?? 0), 0) /
        (storageEntries.length || 1);

      const nextHeartbeat = trimSeries(
        [...bucket.heartbeat, { timestamp, data }],
        MAX_HEARTBEATS,
      );

      const nextMetrics = {
        cpu: trimSeries(
          [...bucket.metrics.cpu, { timestamp, value: cpuValue }],
          MAX_HEARTBEATS,
        ),
        memory: trimSeries(
          [...bucket.metrics.memory, { timestamp, value: memoryValue }],
          MAX_HEARTBEATS,
        ),
        storage: trimSeries(
          [...bucket.metrics.storage, { timestamp, value: storageValue }],
          MAX_HEARTBEATS,
        ),
      };

      const displayEvent: DisplayEvent = {
        id: `${apiKey}-heartbeat-${timestamp}`,
        channel: `mon:${apiKey}:system:heartbeat`,
        type: "heartbeat",
        level: "info",
        message: `Heartbeat • CPU ${cpuValue.toFixed(1)}% · MEM ${memoryValue.toFixed(
          1,
        )}%`,
        timestamp,
      };

      return {
        byApi: {
          ...state.byApi,
          [apiKey]: {
            ...bucket,
            heartbeat: nextHeartbeat,
            metrics: nextMetrics,
            events: appendEvent(bucket.events, displayEvent),
            lastHeartbeatTs: timestamp,
          },
        },
      };
    });
  },
  ingestSystemStatus: (event) => {
    const { api_key: apiKey, data, ts } = event;
    if (!apiKey) return;
    const timestamp = toTimestamp(ts);
    set((state) => {
      const bucket = ensureBucket(state, apiKey);
      const displayEvent: DisplayEvent = {
        id: `${apiKey}-status-${timestamp}`,
        channel: `mon:${apiKey}:system:status`,
        type: "status",
        level: levelFromStatus(data.status),
        message: `System status → ${data.status}`,
        timestamp,
      };

      return {
        byApi: {
          ...state.byApi,
          [apiKey]: {
            ...bucket,
            status: { ...data, timestamp },
            events: appendEvent(bucket.events, displayEvent),
          },
        },
      };
    });
  },
  ingestAgentStatus: (event) => {
    const { api_key: apiKey, data, ts } = event;
    if (!apiKey) return;
    const timestamp = toTimestamp(ts);
    set((state) => {
      const bucket = ensureBucket(state, apiKey);
      const existing = bucket.agents.find((agent) => agent.id === data.id);
      const mergedName =
        data.name ??
        (data as any)?.agent_name ??
        existing?.name ??
        undefined;

      const merged = {
        ...existing,
        ...data,
        name: mergedName,
        timestamp,
      } as AgentStatusData & { timestamp: number };

      const nextAgents = [
        merged,
        ...bucket.agents.filter((agent) => agent.id !== data.id),
      ].slice(0, MAX_AGENT_ENTRIES);

      const displayEvent: DisplayEvent = {
        id: `${apiKey}-agent-${data.id}-${timestamp}`,
        channel: `mon:${apiKey}:agent:status`,
        type: "agent_status",
        level: levelFromAgentStatus(data.status),
        message: `Agent ${merged.name ?? data.id} → ${data.status}`,
        timestamp,
      };

      return {
        byApi: {
          ...state.byApi,
          [apiKey]: {
            ...bucket,
            agents: nextAgents,
            events: appendEvent(bucket.events, displayEvent),
          },
        },
      };
    });
  },
  setAgentList: (apiKey, agents) => {
    if (!apiKey || !agents) return;
    set((state) => {
      const bucket = ensureBucket(state, apiKey);
      const existingMap = new Map(
        bucket.agents.map((agent) => [agent.id, agent]),
      );

      agents.forEach((agent) => {
        if (!agent?.id) return;
        const previous = existingMap.get(agent.id);
        const nextTimestamp = agent.timestamp ?? previous?.timestamp ?? Date.now();
        const name =
          agent.name ??
          (agent as any).agent_name ??
          previous?.name ??
          undefined;
        existingMap.set(agent.id, {
          ...previous,
          ...agent,
          name,
          timestamp: nextTimestamp,
        });
      });

      const nextAgents = Array.from(existingMap.values())
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .slice(0, MAX_AGENT_ENTRIES);

      return {
        byApi: {
          ...state.byApi,
          [apiKey]: {
            ...bucket,
            agents: nextAgents,
          },
        },
      };
    });
  },
  setSystemList: (systems) => {
    const normalized = Array.isArray(systems)
      ? systems.filter((system) => system && system.apiKey)
      : [];

    set((state) => {
      const nextByApi: Record<string, SystemBucket> = { ...state.byApi };
      normalized.forEach((system) => {
        const apiKey = system.apiKey;
        const existing = nextByApi[apiKey] ?? createBucket(apiKey, {});
        nextByApi[apiKey] = {
          ...existing,
          meta: {
            ...existing.meta,
            apiKey,
            name: system.systemName ?? existing.meta.name,
            description: system.description ?? existing.meta.description,
            owner: system.organizationId ?? existing.meta.owner,
            environment: system.environment ?? existing.meta.environment,
            region: system.region ?? existing.meta.region,
            model: system.model ?? existing.meta.model,
            tags: system.tags ?? existing.meta.tags,
            registeredAt: system.registeredAt ?? existing.meta.registeredAt,
            lastSeenAt: system.lastSeenAt ?? existing.meta.lastSeenAt,
            status: system.status ?? existing.meta.status,
            healthStatus: system.healthStatus ?? existing.meta.healthStatus,
          },
        };
      });

      return {
        byApi: nextByApi,
        systemList: normalized.map((system) => ({
          apiKey: system.apiKey,
          systemName: system.systemName ?? null,
          environment: system.environment ?? null,
          organizationId: system.organizationId ?? null,
          registeredAt: system.registeredAt ?? null,
          lastSeenAt: system.lastSeenAt ?? null,
          status: system.status ?? null,
          healthStatus: system.healthStatus ?? null,
          description: system.description ?? null,
          region: system.region ?? null,
          model: system.model ?? null,
          tags: system.tags ?? null,
        })),
      };
    });
  },
  setSelectedApiKey: (apiKey) => {
    set((state) =>
      state.selectedApiKey === apiKey ? state : { selectedApiKey: apiKey },
    );
  },
  ingestLlmUsage: (event) => {
    const { api_key: apiKey, data, ts } = event;
    if (!apiKey) return;
    const timestamp = toTimestamp(ts);
    set((state) => {
      const bucket = ensureBucket(state, apiKey);
      const displayEvent: DisplayEvent = {
        id: `${apiKey}-llm-${timestamp}`,
        channel: `mon:${apiKey}:system:llm_usage`,
        type: "llm_usage",
        level: "info",
        message: `LLM usage • ${data.provider} ${data.model_name} (${data.mode})`,
        timestamp,
      };

      return {
        byApi: {
          ...state.byApi,
          [apiKey]: {
            ...bucket,
            llm: { ...data, timestamp },
            events: appendEvent(bucket.events, displayEvent),
          },
        },
      };
    });
  },
  ingestSystemEvent: (event) => {
    const { api_key: apiKey, data, ts } = event;
    if (!apiKey) return;
    const timestamp = toTimestamp(ts);
    set((state) => {
      const bucket = ensureBucket(state, apiKey);
      const displayEvent: DisplayEvent = {
        id: `${apiKey}-system-event-${timestamp}`,
        channel: "mon:system:new",
        type: "system_event",
        level: "info",
        message: `System ${data.event} • agent ${data.agent_id}`,
        timestamp,
      };

      return {
        byApi: {
          ...state.byApi,
          [apiKey]: {
            ...bucket,
            events: appendEvent(bucket.events, displayEvent),
          },
        },
      };
    });
  },
}));

export const selectSystemBucket = (apiKey: string) => (state: MonitoringStoreState) =>
  state.byApi[apiKey];

export const selectCpuSeries = (apiKey: string) => (state: MonitoringStoreState) =>
  state.byApi[apiKey]?.metrics.cpu ?? [];

export const selectLatestSnapshot = (apiKey: string) => (
  state: MonitoringStoreState,
) => {
  const bucket = state.byApi[apiKey];
  if (!bucket) return undefined;

  const latestHeartbeat = bucket.heartbeat[bucket.heartbeat.length - 1];
  return {
    apiKey,
    meta: bucket.meta,
    metrics: bucket.metrics,
    heartbeat: latestHeartbeat,
    status: bucket.status,
    agents: bucket.agents,
    llm: bucket.llm,
    events: bucket.events,
    lastHeartbeatTs: bucket.lastHeartbeatTs,
  };
};

export const selectAllSystems = (state: MonitoringStoreState) =>
  Object.values(state.byApi);

export const selectSystemList = (state: MonitoringStoreState) => state.systemList;

export const selectSelectedApiKey = (state: MonitoringStoreState) =>
  state.selectedApiKey;

export type { HeartbeatData, SystemStatusData, AgentStatusData, LlmUsageData };

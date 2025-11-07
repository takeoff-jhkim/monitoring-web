import { create } from "zustand";

const MAX_POINTS = 40;
const MAX_EVENTS = 30;

const createEmptyMetrics = () => ({
  cpu: [],
  memory: [],
  storage: [],
});

const createEmptyStatuses = () => ({
  heartbeatTs: null,
  system: "initializing",
  agent: "idle",
});

const createEmptyLLMUsage = () => ({
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  requestsPerMin: 0,
  tokensPerMin: 0,
  costUsd: 0,
});

const createSystemBucket = (meta = {}) => ({
  meta,
  metrics: createEmptyMetrics(),
  statuses: createEmptyStatuses(),
  llmUsage: createEmptyLLMUsage(),
  events: [],
});

export const createInitialSystemState = (meta = {}) => createSystemBucket(meta);

const ensureBucket = (state, apiKey, meta) =>
  state.systems[apiKey] ?? createSystemBucket({ apiKey, ...meta });

export const useMonitoringStore = create((set) => ({
  systems: {},
  registerSystems: (definitions = []) =>
    set((state) => {
      if (!definitions.length) return undefined;
      let mutated = false;
      const nextSystems = { ...state.systems };
      definitions.forEach((definition) => {
        const { apiKey } = definition;
        if (!apiKey) return;
        if (!nextSystems[apiKey]) {
          nextSystems[apiKey] = createSystemBucket(definition);
          mutated = true;
        } else {
          nextSystems[apiKey] = {
            ...nextSystems[apiKey],
            meta: { ...nextSystems[apiKey].meta, ...definition },
          };
          mutated = true;
        }
      });
      return mutated ? { systems: nextSystems } : undefined;
    }),
  pushMetricPoint: (apiKey, metric, point) =>
    set((state) => {
      if (!apiKey || !metric) return undefined;
      const bucket = ensureBucket(state, apiKey);
      const currentSeries = bucket.metrics[metric] || [];
      const nextSeries = [...currentSeries, point];
      if (nextSeries.length > MAX_POINTS) {
        nextSeries.shift();
      }
      return {
        systems: {
          ...state.systems,
          [apiKey]: {
            ...bucket,
            metrics: {
              ...bucket.metrics,
              [metric]: nextSeries,
            },
          },
        },
      };
    }),
  setSystemStatus: (apiKey, system) =>
    set((state) => {
      if (!apiKey) return undefined;
      const bucket = ensureBucket(state, apiKey);
      return {
        systems: {
          ...state.systems,
          [apiKey]: {
            ...bucket,
            statuses: {
              ...bucket.statuses,
              system,
            },
          },
        },
      };
    }),
  setAgentStatus: (apiKey, agent) =>
    set((state) => {
      if (!apiKey) return undefined;
      const bucket = ensureBucket(state, apiKey);
      return {
        systems: {
          ...state.systems,
          [apiKey]: {
            ...bucket,
            statuses: {
              ...bucket.statuses,
              agent,
            },
          },
        },
      };
    }),
  setHeartbeat: (apiKey, heartbeatTs) =>
    set((state) => {
      if (!apiKey) return undefined;
      const bucket = ensureBucket(state, apiKey);
      return {
        systems: {
          ...state.systems,
          [apiKey]: {
            ...bucket,
            statuses: {
              ...bucket.statuses,
              heartbeatTs,
            },
          },
        },
      };
    }),
  setLLMUsage: (apiKey, usage) =>
    set((state) => {
      if (!apiKey) return undefined;
      const bucket = ensureBucket(state, apiKey);
      return {
        systems: {
          ...state.systems,
          [apiKey]: {
            ...bucket,
            llmUsage: { ...bucket.llmUsage, ...usage },
          },
        },
      };
    }),
  pushEvent: (apiKey, event) =>
    set((state) => {
      if (!apiKey || !event) return undefined;
      const bucket = ensureBucket(state, apiKey);
      const nextEvents = [event, ...bucket.events];
      return {
        systems: {
          ...state.systems,
          [apiKey]: {
            ...bucket,
            events: nextEvents.slice(0, MAX_EVENTS),
          },
        },
      };
    }),
}));

import { create } from "zustand";

const MAX_POINTS = 40;
const MAX_EVENTS = 30;

export const useMonitoringStore = create((set, get) => ({
  metrics: {
    cpu: [],
    memory: [],
    storage: [],
  },
  statuses: {
    heartbeatTs: null,
    system: "initializing",
    agent: "idle",
  },
  llmUsage: {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestsPerMin: 0,
    tokensPerMin: 0,
    costUsd: 0,
  },
  events: [],
  pushMetricPoint: (metric, point) =>
    set((state) => {
      const next = [...state.metrics[metric], point];
      if (next.length > MAX_POINTS) {
        next.shift();
      }
      return {
        metrics: {
          ...state.metrics,
          [metric]: next,
        },
      };
    }),
  setSystemStatus: (system) =>
    set((state) => ({
      statuses: {
        ...state.statuses,
        system,
      },
    })),
  setAgentStatus: (agent) =>
    set((state) => ({
      statuses: {
        ...state.statuses,
        agent,
      },
    })),
  setHeartbeat: (heartbeatTs) =>
    set((state) => ({
      statuses: {
        ...state.statuses,
        heartbeatTs,
      },
    })),
  setLLMUsage: (usage) =>
    set(() => ({
      llmUsage: { ...usage },
    })),
  pushEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, MAX_EVENTS),
    })),
}));

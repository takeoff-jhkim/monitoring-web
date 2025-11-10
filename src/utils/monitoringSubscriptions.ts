import { ENV } from "../config/env";
import {
  MonitoringEvent,
  useMonitoringStore,
} from "../store/useMonitoringStore";
import { startMockFor, stopMockFor } from "./mockPublisher";

type Cleanup = () => void;

type EventPayload = {
  ts?: string;
  type?: string;
  api_key?: string;
  apiKey?: string;
  channel?: string;
  data?: unknown;
  [key: string]: any;
};

const CHANNEL_BUILDERS = [
  (apiKey: string) => `mon:${apiKey}:system:heartbeat`,
  (apiKey: string) => `mon:${apiKey}:system:status`,
  (apiKey: string) => `mon:${apiKey}:agent:status`,
  (apiKey: string) => `mon:${apiKey}:system:llm_usage`,
  () => `mon:system:new`,
];

const EVENT_TYPES = [
  "heartbeat",
  "status",
  "agent_status",
  "llm_usage",
  "system_event",
];

type RegistryEntry = {
  cleanup: Cleanup;
  refCount: number;
};

const registry = new Map<string, RegistryEntry>();

const inferTypeFromChannel = (channel?: string) => {
  if (!channel) return undefined;
  if (channel.includes("heartbeat")) return "heartbeat";
  if (channel.includes("agent:status")) return "agent_status";
  if (channel.includes("system:status")) return "status";
  if (channel.includes("system:llm_usage")) return "llm_usage";
  if (channel.includes("system:new") || channel.includes("system:event")) {
    return "system_event";
  }
  return undefined;
};

const dispatchEvent = <T,>(event: MonitoringEvent<T>) => {
  const store = useMonitoringStore.getState();
  switch (event.type) {
    case "heartbeat":
      store.ingestHeartbeat(event as MonitoringEvent<any>);
      break;
    case "status":
      store.ingestSystemStatus(event as MonitoringEvent<any>);
      break;
    case "agent_status":
      store.ingestAgentStatus(event as MonitoringEvent<any>);
      break;
    case "llm_usage":
      store.ingestLlmUsage(event as MonitoringEvent<any>);
      break;
    case "system_event":
      store.ingestSystemEvent(event as MonitoringEvent<any>);
      break;
    default:
      break;
  }
};

const buildEventSourceUrl = (channels: string[]) => {
  const origin = ENV.API_URL || window.location.origin;
  const url = new URL("/sse/monitoring/channels", origin);
  url.searchParams.set("channels", channels.join(","));
  return url.toString();
};

const createSseSubscription = (apiKey: string): Cleanup => {
  try {
    const channels = Array.from(
      new Set(CHANNEL_BUILDERS.map((builder) => builder(apiKey))),
    );
    const url = buildEventSourceUrl(channels);
    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    const parseAndDispatch = (forcedType?: string) => (event: MessageEvent) => {
      if (!event.data) return;
      let payload: EventPayload;
      try {
        payload = JSON.parse(event.data);
      } catch (error) {
        console.warn("Unable to parse monitoring event", error, event.data);
        return;
      }

      const resolvedType =
        forcedType || payload.type || inferTypeFromChannel(payload.channel);
      if (!resolvedType) return;

      const normalized: MonitoringEvent<any> = {
        ts:
          payload.ts ||
          payload.timestamp?.toString() ||
          Math.floor(Date.now() / 1000).toString(),
        type: resolvedType,
        api_key: payload.api_key || payload.apiKey || apiKey,
        data: payload.data ?? payload,
      };

      dispatchEvent(normalized);
    };

    const listeners = EVENT_TYPES.map((type) => {
      const handler = parseAndDispatch(type);
      eventSource.addEventListener(type, handler as EventListener);
      return { type, handler };
    });

    eventSource.onmessage = parseAndDispatch();
    eventSource.onerror = (error) => {
      console.error("Monitoring SSE error", error);
    };

    return () => {
      listeners.forEach(({ type, handler }) => {
        eventSource.removeEventListener(type, handler as EventListener);
      });
      eventSource.close();
    };
  } catch (error) {
    console.error("Failed to establish monitoring SSE", error);
    return () => {};
  }
};

const createMockSubscription = (apiKey: string): Cleanup => {
  startMockFor(apiKey);
  return () => {
    stopMockFor(apiKey);
  };
};

const decrement = (apiKey: string) => {
  const entry = registry.get(apiKey);
  if (!entry) return;

  entry.refCount -= 1;

  if (entry.refCount <= 0) {
    try {
      entry.cleanup?.();
    } finally {
      registry.delete(apiKey);
    }
  } else {
    registry.set(apiKey, entry);
  }
};

export const monitoringSubscriptions = {
  start(apiKey: string) {
    if (!apiKey) return () => {};

    const existing = registry.get(apiKey);
    if (existing) {
      existing.refCount += 1;
      registry.set(apiKey, existing);
    } else {
      const cleanup = ENV.USE_MOCK
        ? createMockSubscription(apiKey)
        : createSseSubscription(apiKey);

      registry.set(apiKey, {
        cleanup,
        refCount: 1,
      });
    }

    let released = false;

    return () => {
      if (released) return;
      released = true;
      decrement(apiKey);
    };
  },
  stop(apiKey: string) {
    if (!apiKey) return;
    decrement(apiKey);
  },
  stopAll() {
    Array.from(registry.values()).forEach((entry) => {
      entry.cleanup?.();
    });
    registry.clear();
  },
};

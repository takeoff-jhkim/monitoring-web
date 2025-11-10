import { ENV } from "../config/env";
import { MonitoringEvent, useMonitoringStore } from "../store/useMonitoringStore";

type ChannelType = "heartbeat" | "status" | "agent_status" | "llm_usage";

type SubscriptionEntry = {
  refCount: number;
  source: EventSource | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
};

const CHANNELS: ChannelType[] = [
  "heartbeat",
  "status",
  "agent_status",
  "llm_usage",
];

const channelName = (apiKey: string, channel: ChannelType) => {
  switch (channel) {
    case "heartbeat":
      return `mon:${apiKey}:system:heartbeat`;
    case "status":
      return `mon:${apiKey}:system:status`;
    case "agent_status":
      return `mon:${apiKey}:agent:status`;
    case "llm_usage":
    default:
      return `mon:${apiKey}:system:llm_usage`;
  }
};

const buildStreamUrl = (apiKey: string) => {
  const baseUrl = ENV.API_URL && ENV.API_URL.length > 0 ? ENV.API_URL : window.location.origin;
  const url = new URL("/sse/monitoring/stream", baseUrl);
  url.searchParams.set(
    "channels",
    CHANNELS.map((channel) => channelName(apiKey, channel)).join(","),
  );
  return url.toString();
};

const dispatchEventToStore = (event: MonitoringEvent<any>) => {
  const store = useMonitoringStore.getState();
  switch (event.type) {
    case "heartbeat":
      store.ingestHeartbeat(event);
      break;
    case "status":
      store.ingestSystemStatus(event);
      break;
    case "agent_status":
      store.ingestAgentStatus(event);
      break;
    case "llm_usage":
      store.ingestLlmUsage(event);
      break;
    default:
      break;
  }
};

class MonitoringSubscriptionManager {
  private entries = new Map<string, SubscriptionEntry>();

  subscribe(apiKey: string) {
    if (!apiKey) return () => {};

    const existing = this.entries.get(apiKey);
    if (existing) {
      existing.refCount += 1;
      return () => this.release(apiKey);
    }

    const entry: SubscriptionEntry = {
      refCount: 1,
      source: null,
      reconnectTimer: null,
    };

    this.entries.set(apiKey, entry);
    this.openStream(apiKey, entry);

    return () => this.release(apiKey);
  }

  private openStream(apiKey: string, entry: SubscriptionEntry) {
    const streamUrl = buildStreamUrl(apiKey);
    try {
      const source = new EventSource(streamUrl, { withCredentials: true });
      entry.source = source;

      source.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data);
          if (payload && payload.type && payload.api_key) {
            dispatchEventToStore(payload);
          }
        } catch (error) {
          console.error("Failed to parse monitoring event", error);
        }
      };

      source.onerror = () => {
        source.close();
        entry.source = null;
        this.scheduleReconnect(apiKey, entry);
      };
    } catch (error) {
      console.error("Failed to open monitoring stream", error);
      this.scheduleReconnect(apiKey, entry);
    }
  }

  private scheduleReconnect(apiKey: string, entry: SubscriptionEntry) {
    if (entry.refCount <= 0) {
      return;
    }
    if (entry.reconnectTimer) {
      return;
    }
    entry.reconnectTimer = setTimeout(() => {
      entry.reconnectTimer = null;
      if (entry.refCount > 0 && !entry.source) {
        this.openStream(apiKey, entry);
      }
    }, 3000);
  }

  private release(apiKey: string) {
    const entry = this.entries.get(apiKey);
    if (!entry) return;

    entry.refCount -= 1;
    if (entry.refCount > 0) return;

    if (entry.reconnectTimer) {
      clearTimeout(entry.reconnectTimer);
      entry.reconnectTimer = null;
    }
    if (entry.source) {
      entry.source.close();
      entry.source = null;
    }

    this.entries.delete(apiKey);
  }
}

export const monitoringSubscriptionManager = new MonitoringSubscriptionManager();

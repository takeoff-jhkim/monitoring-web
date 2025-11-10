import { SYSTEM_DEFINITIONS } from "../config/systems";
import {
  MonitoringEvent,
  SystemMeta,
  useMonitoringStore,
} from "../store/useMonitoringStore";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const statusOptions = ["ready", "rag_building", "ready", "off"] as const;
const agentSequence = ["running", "idle", "running", "done"] as const;
const llmModes = [
  { mode: "external_api", provider: "OpenAI", model_name: "gpt-4.1-mini" },
  { mode: "local", provider: "Hermes", model_name: "llama-3.1-8b" },
];

const handles = new Map<string, () => void>();
let systemNewTimer: ReturnType<typeof setTimeout> | null = null;

const sendEvent = <T,>(
  type: MonitoringEvent<T>["type"],
  apiKey: string,
  data: T,
) => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const store = useMonitoringStore.getState();
  const event: MonitoringEvent<T> = {
    ts,
    type,
    api_key: apiKey,
    data,
  };

  switch (type) {
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

const ensureSystemNewTimer = () => {
  if (systemNewTimer) return;
  const schedule = () => {
    systemNewTimer = setTimeout(() => {
      const activeKeys = Array.from(handles.keys());
      if (activeKeys.length > 0) {
        const apiKey = pick(activeKeys);
        const suffix = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
        const payload = {
          event: "created",
          agent_id: `assistant-${suffix}`,
          created_at: new Date().toISOString(),
        };
        sendEvent("system_event", apiKey, payload);
      }
      schedule();
    }, 15000);
  };
  schedule();
};

const clearSystemNewTimerIfIdle = () => {
  if (handles.size === 0 && systemNewTimer) {
    clearTimeout(systemNewTimer);
    systemNewTimer = null;
  }
};

type MockState = {
  cpu: number;
  memory: number;
  storage: number;
  temperature: number;
  uptime: number;
  status: typeof statusOptions[number];
  agentIndex: number;
  llmIndex: number;
};

const createInitialState = (): MockState => ({
  cpu: 27.5,
  memory: 43.1,
  storage: 39.0,
  temperature: 61.2,
  uptime: 842.7,
  status: "ready",
  agentIndex: 0,
  llmIndex: 0,
});

export const startMockFor = (apiKey: string, meta?: Partial<SystemMeta>) => {
  if (!apiKey || handles.has(apiKey)) return;

  const store = useMonitoringStore.getState();
  store.registerSystems([{ apiKey, ...(meta ?? {}) }]);

  const state = createInitialState();
  const timers: ReturnType<typeof setInterval>[] = [];
  let statusTimeout: ReturnType<typeof setTimeout> | null = null;
  const agentId = "rag-builder";
  const mainAgentId = "main-agent";

  const sendHeartbeat = () => {
    const nextHeartbeat = {
      uptime_seconds: Number(state.uptime.toFixed(1)),
      hardware: {
        cpu: {
          util_percent: Number(state.cpu.toFixed(1)),
          temperature_c: Number(state.temperature.toFixed(1)),
        },
        memory: {
          util_percent: Number(state.memory.toFixed(1)),
        },
        storage: [
          {
            mount: "/",
            util_percent: Number(state.storage.toFixed(1)),
          },
        ],
      },
    };

    sendEvent("heartbeat", apiKey, nextHeartbeat);

    state.uptime = Number((state.uptime + randomBetween(4.5, 5.5)).toFixed(1));
    state.cpu = clamp(state.cpu + randomBetween(-2.5, 2.5), 5, 95);
    state.memory = clamp(state.memory + randomBetween(-1.5, 1.5), 10, 90);
    state.storage = clamp(state.storage + randomBetween(-0.5, 0.5), 10, 95);
    state.temperature = clamp(state.temperature + randomBetween(-1.5, 1.5), 30, 80);
  };

  const sendAgentStatus = () => {
    const status = agentSequence[state.agentIndex];
    sendEvent("agent_status", apiKey, {
      id: agentId,
      status,
    });
    state.agentIndex = (state.agentIndex + 1) % agentSequence.length;
  };

  const runStatusUpdate = () => {
    statusTimeout = setTimeout(() => {
      state.status = pick([...statusOptions]);
      sendEvent("status", apiKey, {
        status: state.status,
        last_connected_at: new Date().toISOString(),
        agent_id: mainAgentId,
      });
      runStatusUpdate();
    }, Math.floor(randomBetween(4000, 10000)));
  };

  const runHeartbeat = () => {
    sendHeartbeat();
    timers.push(setInterval(sendHeartbeat, 5000));
  };

  const runAgentStatus = () => {
    const timer = setInterval(() => {
      sendAgentStatus();
    }, 5000);
    timers.push(timer);
  };

  const runLlmUsage = () => {
    const timer = setInterval(() => {
      state.llmIndex = (state.llmIndex + 1) % llmModes.length;
      const profile = llmModes[state.llmIndex];
      const promptTokens = Math.round(randomBetween(220, 360));
      const completionTokens = Math.round(randomBetween(120, 240));
      const totalTokens = promptTokens + completionTokens;
      const requestsPerMin = Math.round(randomBetween(4, 8));
      const tokensPerMin = totalTokens * requestsPerMin;
      const costUsd = Number(((totalTokens / 1000) * 0.0025).toFixed(4));

      sendEvent("llm_usage", apiKey, {
        ...profile,
        promptTokens,
        completionTokens,
        totalTokens,
        requestsPerMin,
        tokensPerMin,
        costUsd,
      });
    }, 20000);
    timers.push(timer);
  };

  // seed initial events
  sendEvent("status", apiKey, {
    status: state.status,
    last_connected_at: new Date().toISOString(),
    agent_id: mainAgentId,
  });
  sendAgentStatus();
  const initialProfile = llmModes[state.llmIndex];
  const promptTokens = Math.round(randomBetween(220, 360));
  const completionTokens = Math.round(randomBetween(120, 240));
  const totalTokens = promptTokens + completionTokens;
  const requestsPerMin = Math.round(randomBetween(4, 8));
  const tokensPerMin = totalTokens * requestsPerMin;
  const costUsd = Number(((totalTokens / 1000) * 0.0025).toFixed(4));
  sendEvent("llm_usage", apiKey, {
    ...initialProfile,
    promptTokens,
    completionTokens,
    totalTokens,
    requestsPerMin,
    tokensPerMin,
    costUsd,
  });
  runHeartbeat();
  runStatusUpdate();
  runAgentStatus();
  runLlmUsage();

  ensureSystemNewTimer();

  handles.set(apiKey, () => {
    timers.forEach((timer) => clearInterval(timer));
    if (statusTimeout) {
      clearTimeout(statusTimeout);
      statusTimeout = null;
    }
    handles.delete(apiKey);
    clearSystemNewTimerIfIdle();
  });
};

export const stopMockFor = (apiKey: string) => {
  const stop = handles.get(apiKey);
  if (!stop) return;
  stop();
};

export const startMockForAll = (systems: SystemMeta[] = SYSTEM_DEFINITIONS) => {
  systems.forEach((system) => startMockFor(system.apiKey, system));
};

export const stopAllMocks = () => {
  Array.from(handles.keys()).forEach((apiKey) => stopMockFor(apiKey));
};

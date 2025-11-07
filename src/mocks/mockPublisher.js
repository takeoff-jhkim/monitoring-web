import { useMonitoringStore } from "../store/monitoringStore";

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const metricState = {
  cpu: 42,
  memory: 63,
  storage: 58,
};

const metricBounds = {
  cpu: { min: 10, max: 98 },
  memory: { min: 25, max: 95 },
  storage: { min: 20, max: 90 },
};

const systemStatuses = [
  { status: "healthy", message: "모든 서비스가 정상 응답 중", level: "info" },
  { status: "stable", message: "경미한 지연이 감지되었지만 허용 범위", level: "info" },
  { status: "degraded", message: "백엔드 API 응답이 느립니다", level: "warning" },
  { status: "incident", message: "스토리지 노드 장애로 페일오버 진행", level: "error" },
];

const agentStatuses = [
  "idle",
  "planning",
  "executing",
  "awaiting_input",
  "suspended",
  "error",
];

const systemEvents = [
  { level: "info", message: "새로운 에이전트가 큐에 등록되었습니다." },
  { level: "info", message: "벡터 스토어 동기화가 완료되었습니다." },
  { level: "warning", message: "LLM 응답 지연이 SLA 임계값을 초과했습니다." },
  { level: "warning", message: "Redis 커넥션 풀이 80%에 도달했습니다." },
  { level: "error", message: "파이프라인 실행 중 Task 3에서 예외가 발생했습니다." },
  { level: "info", message: "사용자 HITL 입력이 접수되어 워크플로우가 재개되었습니다." },
  { level: "warning", message: "CPU 사용량이 90%를 초과했습니다." },
  { level: "info", message: "LLM 토큰 사용량이 자동으로 리셋되었습니다." },
];

const randomBetween = (min, max) =>
  Number((Math.random() * (max - min) + min).toFixed(2));

export function startMockRedisPublisher() {
  const {
    pushMetricPoint,
    setSystemStatus,
    setAgentStatus,
    setHeartbeat,
    setLLMUsage,
    pushEvent,
  } = useMonitoringStore.getState();

  const timers = [];

  // Metric stream
  timers.push(
    setInterval(() => {
      const ts = Date.now();
      Object.keys(metricState).forEach((metric) => {
        const drift = randomBetween(-6, 6);
        const next = clamp(
          Number((metricState[metric] + drift).toFixed(2)),
          metricBounds[metric].min,
          metricBounds[metric].max,
        );
        metricState[metric] = next;
        pushMetricPoint(metric, { timestamp: ts, value: next });
      });
    }, 1500),
  );

  // Heartbeat channel
  timers.push(
    setInterval(() => {
      const ts = Date.now();
      setHeartbeat(ts);
      pushEvent({
        id: `heartbeat-${ts}`,
        channel: "heartbeat",
        level: "info",
        message: "에이전트로부터 heartbeat 수신",
        timestamp: ts,
      });
    }, 3000),
  );

  // System status updates
  timers.push(
    setInterval(() => {
      const entry = pick(systemStatuses);
      const ts = Date.now();
      setSystemStatus(entry.status);
      pushEvent({
        id: `status-${ts}`,
        channel: "status",
        level: entry.level,
        message: entry.message,
        timestamp: ts,
      });
    }, 7000),
  );

  // Agent status updates
  timers.push(
    setInterval(() => {
      const next = pick(agentStatuses);
      const ts = Date.now();
      setAgentStatus(next);
      pushEvent({
        id: `agent-${ts}`,
        channel: "agent_status",
        level: next === "error" ? "error" : "info",
        message: `에이전트 상태가 "${next}" 로 전환되었습니다.`,
        timestamp: ts,
      });
    }, 6500),
  );

  // LLM usage updates
  timers.push(
    setInterval(() => {
      const promptTokens = Math.round(randomBetween(200, 900));
      const completionTokens = Math.round(randomBetween(150, 700));
      const totalTokens = promptTokens + completionTokens;
      const requestsPerMin = Math.round(randomBetween(6, 18));
      const tokensPerMin = totalTokens * requestsPerMin;
      const costUsd = Number(((totalTokens / 1000) * 0.002).toFixed(4));

      setLLMUsage({
        promptTokens,
        completionTokens,
        totalTokens,
        requestsPerMin,
        tokensPerMin,
        costUsd,
      });

      const ts = Date.now();
      pushEvent({
        id: `llm-${ts}`,
        channel: "llm_usage",
        level: "info",
        message: `LLM 토큰 ${totalTokens.toLocaleString()}개 사용 (RPM ${requestsPerMin})`,
        timestamp: ts,
      });
    }, 5000),
  );

  // System events stream
  timers.push(
    setInterval(() => {
      const entry = pick(systemEvents);
      const ts = Date.now();
      pushEvent({
        id: `event-${ts}`,
        channel: "system_event",
        level: entry.level,
        message: entry.message,
        timestamp: ts,
      });
    }, 4200),
  );

  return () => {
    timers.forEach((timer) => clearInterval(timer));
  };
}

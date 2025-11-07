import { Link, useParams } from "react-router-dom";
import MetricChart from "../components/common/MetricChart";
import LLMUsagePanel from "../components/monitoring/LLMUsagePanel";
import EventLog from "../components/monitoring/EventLog";
import StatusPanel from "../components/monitoring/StatusPanel";
import { SYSTEM_BY_KEY } from "../config/systems";
import {
  selectLatestSnapshot,
  useMonitoringStore,
} from "../store/useMonitoringStore";

const statusDescriptions = {
  ready: "정상적으로 연결되어 있습니다.",
  off: "연결이 해제된 상태입니다.",
  init: "초기화 중입니다.",
  rag_building: "RAG 자원을 준비 중입니다.",
};

const agentDescriptions = {
  idle: "대기 중 - 신규 작업 가능",
  running: "작업을 실행 중입니다.",
  done: "마지막 작업을 완료했습니다.",
};

const chartConfig = [
  { key: "cpu", title: "CPU Usage", color: "#2563eb" },
  { key: "memory", title: "Memory Usage", color: "#0f766e" },
  { key: "storage", title: "Storage Usage", color: "#d97706" },
];

export default function SystemDetailPage() {
  const { apiKey } = useParams();
  const snapshot = useMonitoringStore((state) =>
    apiKey ? selectLatestSnapshot(apiKey)(state) : undefined,
  );

  const metaFromConfig = apiKey ? SYSTEM_BY_KEY[apiKey] : undefined;
  const meta = { ...metaFromConfig, ...(snapshot?.meta ?? {}) };

  const metrics = snapshot?.metrics ?? { cpu: [], memory: [], storage: [] };
  const events = snapshot?.events ?? [];
  const systemStatus = snapshot?.status?.status ?? "init";
  const systemDescription =
    statusDescriptions[systemStatus] ?? "상태 정보 없음";
  const latestAgent = snapshot?.agents?.[0];
  const agentStatus = latestAgent?.status ?? "idle";
  const agentDescription =
    agentDescriptions[agentStatus] ?? "에이전트 상태 정보 없음";
  const heartbeatAge = snapshot?.lastHeartbeatTs
    ? Math.max(0, Math.round((Date.now() - snapshot.lastHeartbeatTs) / 1000))
    : null;
  const llmUsage = snapshot?.llm ?? {
    mode: "--",
    provider: "--",
    model_name: "--",
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestsPerMin: 0,
    tokensPerMin: 0,
    costUsd: 0,
  };

  return (
    <div className="monitoring-page">
      <header className="page-header detail-header">
        <div>
          <Link to="/systems" className="back-link">
            ← Systems Grid
          </Link>
          <h1>{meta?.name || apiKey}</h1>
          <p>{meta?.description || "등록되지 않은 시스템입니다."}</p>
          <div className="detail-meta-row">
            {meta?.environment && (
              <span className="badge badge-soft">{meta.environment}</span>
            )}
            {meta?.region && <span className="badge">{meta.region}</span>}
            {meta?.owner && <span className="badge">{meta.owner}</span>}
            {meta?.model && (
              <span className="badge badge-info">model: {meta.model}</span>
            )}
          </div>
        </div>
        <div className="heartbeat-indicator">
          <span
            className={[
              "heartbeat-dot",
              heartbeatAge === null ? "heartbeat-dot--idle" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
          {heartbeatAge === null
            ? "Heartbeat 수신 대기 중"
            : heartbeatAge === 0
              ? "방금 heartbeat 수신"
              : `${heartbeatAge}s 전 heartbeat`}
        </div>
      </header>

      <section className="status-grid">
        <StatusPanel
          title="System Status"
          value={systemStatus}
          description={systemDescription}
        />
        <StatusPanel
          title="Agent Status"
          value={agentStatus}
          description={agentDescription}
        />
        <div className="card status-card">
          <div className="status-title">LLM Load</div>
          <div className="status-value" style={{ color: "#2563eb" }}>
            {llmUsage.requestsPerMin
              ? `${llmUsage.requestsPerMin} req/min`
              : "--"}
          </div>
          <p className="status-desc">
            모드 {llmUsage.mode ?? "--"} · 모델 {llmUsage.model_name ?? "--"}
          </p>
        </div>
      </section>

      <section className="chart-grid">
        {chartConfig.map((chart) => (
          <MetricChart
            key={chart.key}
            title={chart.title}
            data={metrics[chart.key] || []}
            color={chart.color}
          />
        ))}
      </section>

      <section className="bottom-grid">
        <LLMUsagePanel usage={llmUsage} />
        <EventLog events={events} />
      </section>
    </div>
  );
}

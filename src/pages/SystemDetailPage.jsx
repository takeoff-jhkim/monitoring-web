import { Link, useParams } from "react-router-dom";
import MetricChart from "../components/common/MetricChart";
import LLMUsagePanel from "../components/monitoring/LLMUsagePanel";
import EventLog from "../components/monitoring/EventLog";
import StatusPanel from "../components/monitoring/StatusPanel";
import { SYSTEM_BY_KEY } from "../config/systems";
import {
  createInitialSystemState,
  useMonitoringStore,
} from "../store/monitoringStore";

const statusDescriptions = {
  healthy: "트래픽과 리소스 모두 안정적인 상태",
  stable: "경미한 지연이 있으나 허용 범위",
  degraded: "사용자 경험 저하, 미션 크리티컬 아님",
  incident: "즉시 대응이 필요한 장애 상태",
  initializing: "초기화 중",
};

const agentDescriptions = {
  idle: "대기 중 - 신규 작업 가능",
  planning: "플레이북을 구성 중",
  executing: "실행 파이프라인 동작 중",
  awaiting_input: "사용자 HITL 응답 대기",
  suspended: "관리자에 의해 일시 중단",
  error: "예외 발생 - 재시작 필요",
};

const chartConfig = [
  { key: "cpu", title: "CPU Usage", color: "#2563eb" },
  { key: "memory", title: "Memory Usage", color: "#0f766e" },
  { key: "storage", title: "Storage Usage", color: "#d97706" },
];

export default function SystemDetailPage() {
  const { apiKey } = useParams();
  const bucket = useMonitoringStore((state) =>
    apiKey ? state.systems[apiKey] : undefined,
  );

  const metaFromConfig = apiKey ? SYSTEM_BY_KEY[apiKey] : undefined;
  const snapshot =
    bucket ??
    createInitialSystemState({
      apiKey,
      ...metaFromConfig,
    });
  const meta = { ...metaFromConfig, ...snapshot.meta };

  const statuses = snapshot.statuses;
  const metrics = snapshot.metrics;
  const llmUsage = snapshot.llmUsage;
  const events = snapshot.events;

  const heartbeatAge = statuses.heartbeatTs
    ? Math.max(0, Math.round((Date.now() - statuses.heartbeatTs) / 1000))
    : null;

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
          value={statuses.system}
          description={statusDescriptions[statuses.system]}
        />
        <StatusPanel
          title="Agent Status"
          value={statuses.agent}
          description={agentDescriptions[statuses.agent]}
        />
        <div className="card status-card">
          <div className="status-title">LLM Load</div>
          <div className="status-value" style={{ color: "#2563eb" }}>
            {llmUsage.requestsPerMin
              ? `${llmUsage.requestsPerMin} req/min`
              : "--"}
          </div>
          <p className="status-desc">
            분당 요청 {llmUsage.tokensPerMin.toLocaleString()} tokens
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

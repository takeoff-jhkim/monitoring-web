import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import MetricChart from "../components/common/MetricChart";
import LLMUsagePanel from "../components/monitoring/LLMUsagePanel";
import EventLog from "../components/monitoring/EventLog";
import StatusPanel from "../components/monitoring/StatusPanel";
import AgentList from "../components/agents/AgentList";
import { SYSTEM_BY_KEY } from "../config/systems";
import {
  selectLatestSnapshot,
  useMonitoringStore,
} from "../store/useMonitoringStore";
import { agentsApi } from "../api/monitoring/agents";
import { STATUS_LABELS, statusClass } from "../components/SystemCard";

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
  WAITING_USER_INPUT: "사용자 입력을 기다리고 있습니다.",
  EXECUTING_TOOL: "필요한 도구를 실행 중입니다.",
  RESPONDING: "응답을 정리하고 있습니다.",
};

const chartConfig = [
  { key: "cpu", title: "CPU Usage", color: "#2563eb" },
  { key: "memory", title: "Memory Usage", color: "#0f766e" },
  { key: "storage", title: "Storage Usage", color: "#d97706" },
];

export function SystemDetailPanel({ apiKey }) {
  const snapshot = useMonitoringStore((state) =>
    apiKey ? selectLatestSnapshot(apiKey)(state) : undefined,
  );
  const registerSystems = useMonitoringStore((state) => state.registerSystems);
  const setAgentList = useMonitoringStore((state) => state.setAgentList);

  const metaFromConfig = apiKey ? SYSTEM_BY_KEY[apiKey] : undefined;
  const meta = { ...metaFromConfig, ...(snapshot?.meta ?? {}) };

  const metrics = snapshot?.metrics ?? { cpu: [], memory: [], storage: [] };
  const events = snapshot?.events ?? [];
  const systemStatus = snapshot?.status?.status ?? "init";
  const systemDescription =
    statusDescriptions[systemStatus] ?? "상태 정보 없음";
  const agents = snapshot?.agents ?? [];
  const latestAgent = agents[0];
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
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
    requestsPerMin: null,
    tokensPerMin: null,
    costUsd: null,
  };

  const latestMetricValue = (series) =>
    Array.isArray(series) && series.length > 0
      ? series[series.length - 1]?.value ?? null
      : null;

  const formatPercent = (value) =>
    typeof value === "number" && Number.isFinite(value)
      ? `${value.toFixed(1)}%`
      : "--";

  const latestCpu = latestMetricValue(metrics.cpu);
  const latestMemory = latestMetricValue(metrics.memory);
  const latestStorage = latestMetricValue(metrics.storage);

  const clampPercent = (value) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : null;

  const usagePercentStats = [
    {
      key: "cpu",
      label: "CPU Usage",
      value: latestCpu,
      barClass: "usage-bar-fill--cpu",
    },
    {
      key: "memory",
      label: "Memory Usage",
      value: latestMemory,
      barClass: "usage-bar-fill--memory",
    },
    {
      key: "storage",
      label: "Storage Usage",
      value: latestStorage,
      barClass: "usage-bar-fill--storage",
    },
  ];

  const llmLoadValue =
    typeof llmUsage.requestsPerMin === "number" &&
    Number.isFinite(llmUsage.requestsPerMin)
      ? `${llmUsage.requestsPerMin.toFixed(1)} req/min`
      : typeof llmUsage.tokensPerMin === "number" &&
          Number.isFinite(llmUsage.tokensPerMin)
        ? `${llmUsage.tokensPerMin.toFixed(0)} tpm`
        : "--";

  useEffect(() => {
    if (!apiKey) return;
    let isActive = true;

    const loadAgents = async () => {
      const response = await agentsApi.getAgentsBySystemKey(apiKey, 0, 50);
      if (!isActive) return;

      if (response?.system) {
        registerSystems([
          {
            apiKey,
            name: response.system.system_name,
            owner: response.system.organization_id,
            environment: response.system.environment,
            region: response.system.region ?? metaFromConfig?.region,
            description:
              response.system.description ?? metaFromConfig?.description,
            registeredAt: response.system.registered_at ?? null,
            lastSeenAt: response.system.last_seen_at ?? null,
            status: response.system.status
              ? response.system.status.toLowerCase()
              : null,
            healthStatus: response.system.health_status ?? null,
          },
        ]);
      }

      if (response?.agents) {
        const normalized = response.agents.map((agent) => ({
          id: agent.agent_id ?? agent.id,
          name: agent.agent_name ?? agent.name,
          status: agent.status ?? "UNKNOWN",
          command: agent.command,
          userEmail: agent.user_email,
          createdAt: agent.created_at,
          timestamp: agent.created_at
            ? Date.parse(agent.created_at)
            : Date.now(),
        }));
        setAgentList(apiKey, normalized);
      }
    };

    loadAgents().catch((error) => {
      console.error("Failed to load agents", error);
    });

    return () => {
      isActive = false;
    };
  }, [
    apiKey,
    registerSystems,
    setAgentList,
    metaFromConfig?.description,
    metaFromConfig?.region,
  ]);

  if (!apiKey) {
    return (
      <div className="card system-detail-empty">
        <p>시스템을 선택하면 상세 정보를 확인할 수 있습니다.</p>
      </div>
    );
  }

  const systemName = meta?.name ?? apiKey;
  const badgeStatus = systemStatus ?? "init";
  const agentCount = agents.length;

  return (
    <div className="system-detail-panel space-y-6">
      <div className="system-detail-panel-head">
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
      </div>

      <section className="system-detail-card card">
        <div className="system-detail-header">
          <div className="system-detail-identity">
            <p className="system-detail-title">
              system name : "{systemName || "--"}"
            </p>
            <p className="system-detail-subtitle">api key : "{apiKey}"</p>
          </div>
          <span className={`status-chip ${statusClass(badgeStatus)}`}>
            {STATUS_LABELS[badgeStatus] ?? badgeStatus}
          </span>
        </div>
        <p className="system-detail-description">
          {meta?.description || "등록되지 않은 시스템입니다."}
        </p>
        <div className="system-detail-meta">
          {meta?.environment && (
            <span className="badge badge-soft">env: {meta.environment}</span>
          )}
          {meta?.region && <span className="badge">{meta.region}</span>}
          {meta?.owner && <span className="badge">owner: {meta.owner}</span>}
          {meta?.model && (
            <span className="badge badge-info">model: {meta.model}</span>
          )}
          {meta?.registeredAt && (
            <span className="badge badge-soft">
              registered: {formatLocalTime(meta.registeredAt)}
            </span>
          )}
          {meta?.lastSeenAt && (
            <span className="badge badge-soft">
              last seen: {formatLocalTime(meta.lastSeenAt)}
            </span>
          )}
        </div>
        <div className="system-detail-usage">
          {usagePercentStats.map((stat) => {
            const percent = clampPercent(stat.value);
            return (
              <div className="usage-stat" key={stat.key}>
                <span className="usage-label">{stat.label}</span>
                <div
                  className={[
                    "usage-bar",
                    percent === null ? "usage-bar--empty" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div
                    className={["usage-bar-fill", stat.barClass]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ width: `${percent ?? 0}%` }}
                  />
                </div>
                <span className="usage-value">{formatPercent(stat.value)}</span>
              </div>
            );
          })}
          <div className="usage-stat">
            <span className="usage-label">LLM Load</span>
            <span className="usage-value">{llmLoadValue}</span>
          </div>
        </div>
        <div className="system-detail-agents">
          <div className="system-detail-agents-head">
            <h2>에이전트 목록</h2>
            <span className="agent-count">{agentCount}명</span>
          </div>
          <AgentList agents={agents} />
        </div>
      </section>

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

export default function SystemDetailPage() {
  const { apiKey } = useParams();

  return (
    <div className="monitoring-page">
      <header className="page-header detail-page-header">
        <Link to="/systems" className="back-link">
          ← Systems Grid
        </Link>
      </header>
      <SystemDetailPanel apiKey={apiKey} />
    </div>
  );
}

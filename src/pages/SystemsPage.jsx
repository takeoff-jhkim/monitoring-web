import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SparkBar from "../components/common/SparkBar";
import {
  formatStatusLabel,
  statusPalette,
} from "../components/monitoring/StatusPanel";
import { SYSTEM_DEFINITIONS } from "../config/systems";
import { useMonitoringStore } from "../store/monitoringStore";

const fallbackStatus = (type) =>
  type === "system" ? "initializing" : "idle";

export default function SystemsPage() {
  const navigate = useNavigate();
  const systems = useMonitoringStore((state) => state.systems);

  const cards = useMemo(
    () =>
      SYSTEM_DEFINITIONS.map((definition) => {
        const bucket = systems[definition.apiKey];
        const cpuSeries = bucket?.metrics?.cpu ?? [];
        const latestCpu = cpuSeries[cpuSeries.length - 1];
        return {
          definition,
          bucket,
          cpuSeries,
          latestCpu,
        };
      }),
    [systems],
  );

  const handleNavigate = (apiKey) => {
    navigate(`/systems/${apiKey}`);
  };

  return (
    <div className="systems-grid-page">
      <header className="page-header">
        <div>
          <h1>Systems Grid</h1>
          <p>여러 에이전트 시스템의 상태와 최근 CPU 추세를 한눈에 확인하세요.</p>
        </div>
      </header>

      <section className="systems-grid">
        {cards.map(({ definition, bucket, cpuSeries, latestCpu }) => {
          const statuses = bucket?.statuses;
          const systemStatus = statuses?.system ?? fallbackStatus("system");
          const agentStatus = statuses?.agent ?? fallbackStatus("agent");
          const heartbeatAge = statuses?.heartbeatTs
            ? Math.max(
                0,
                Math.round((Date.now() - statuses.heartbeatTs) / 1000),
              )
            : null;

          return (
            <article
              key={definition.apiKey}
              className="system-card"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate(definition.apiKey)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleNavigate(definition.apiKey);
                }
              }}
              aria-label={`${definition.name} 상세로 이동`}
            >
              <div className="system-card-head">
                <div>
                  <p className="system-card-key">{definition.apiKey}</p>
                  <h2>{definition.name}</h2>
                  <p className="system-card-desc">{definition.description}</p>
                </div>
                <div className="system-card-badges">
                  <span className="badge badge-soft">
                    {definition.environment}
                  </span>
                  <span className="badge">{definition.region}</span>
                </div>
              </div>

              <div className="system-card-meta">
                <span>{definition.owner}</span>
                <div className="system-card-tags">
                  {definition.tags?.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="system-card-statuses">
                {[
                  { label: "System", value: systemStatus },
                  { label: "Agent", value: agentStatus },
                ].map((status) => {
                  const color = statusPalette[status.value] || "#475467";
                  return (
                    <div
                      key={status.label}
                      className="status-pill"
                      style={{ borderColor: color }}
                    >
                      <span>{status.label}</span>
                      <strong style={{ color }}>
                        {formatStatusLabel(status.value)}
                      </strong>
                    </div>
                  );
                })}
                <div className="heartbeat-chip">
                  <span
                    className={[
                      "heartbeat-dot",
                      heartbeatAge !== null ? "" : "heartbeat-dot--idle",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  {heartbeatAge === null
                    ? "Heartbeat 대기"
                    : heartbeatAge === 0
                      ? "방금 수신"
                      : `${heartbeatAge}s 전`}
                </div>
              </div>

              <div className="system-card-spark">
                <div>
                  <p className="sparkbar-label">CPU (최근 30포인트)</p>
                  <p className="sparkbar-value">
                    {latestCpu ? `${latestCpu.value.toFixed(1)}%` : "--"}
                  </p>
                </div>
                <SparkBar points={cpuSeries} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

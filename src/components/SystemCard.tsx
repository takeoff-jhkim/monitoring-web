import { useMemo } from "react";

export const STATUS_LABELS: Record<string, string> = {
  ready: "Ready",
  off: "Off",
  init: "Init",
  rag_building: "RAG Building",
};

export const statusClass = (status: string | undefined) => {
  switch (status) {
    case "ready":
      return "status-ready";
    case "off":
      return "status-off";
    case "rag_building":
      return "status-rag";
    case "init":
    default:
      return "status-init";
  }
};

const formatPercent = (value?: number | null) =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${value.toFixed(1)}%`
    : "--";

const formatLocalTime = (iso?: string) => {
  if (!iso) return "--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

type SystemCardProps = {
  apiKey: string;
  name?: string;
  status?: string;
  cpuSeries: number[];
  cpu?: number | null;
  memory?: number | null;
  storage?: number | null;
  llm?: {
    mode?: string;
    provider?: string;
    model_name?: string;
  } | null;
  lastConnectedAt?: string;
  onClick?: () => void;
};

const WINDOW = 30;

export function SystemCard({
  apiKey,
  name,
  status,
  cpuSeries,
  cpu,
  memory,
  storage,
  llm,
  lastConnectedAt,
  onClick,
}: SystemCardProps) {
  const bars = useMemo(() => {
    const trimmed = cpuSeries.slice(-WINDOW);
    const padded =
      trimmed.length >= WINDOW
        ? trimmed
        : [...Array(WINDOW - trimmed.length).fill(null), ...trimmed];
    return padded.map((value) =>
      typeof value === "number" ? Math.max(2, Math.min(100, value)) : 2,
    );
  }, [cpuSeries]);

  const badgeStatus = status ?? "init";

  return (
    <article
      className="rounded-2xl shadow p-4 bg-white flex flex-col gap-3 transition-shadow hover:shadow-lg focus-within:shadow-lg cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${apiKey} 시스템 상세 보기`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-slate-900">
            system name : "{name ?? "--"}"
          </p>
          <p className="text-slate-500">api key : "{apiKey}"</p>
        </div>
        <span className={`status-chip ${statusClass(badgeStatus)}`}>
          {STATUS_LABELS[badgeStatus] ?? badgeStatus}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="sparkbar-inline" aria-label="최근 CPU 30포인트">
          {bars.map((height, index) => (
            <div
              key={index}
              className="sparkbar-bar"
              style={{ height: `${height}%`, transition: "height 200ms" }}
            />
          ))}
        </div>
        <div className="flex-1 text-sm space-y-1">
          <div className="metric-line">
            <span>CPU</span>
            <strong>{formatPercent(cpu)}</strong>
          </div>
          <div className="metric-line">
            <span>Memory</span>
            <strong>{formatPercent(memory)}</strong>
          </div>
          <div className="metric-line">
            <span>Storage</span>
            <strong>{formatPercent(storage)}</strong>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>
          <span className="font-medium text-slate-600">LLM</span>: {llm?.mode ?? "--"}
          {llm?.provider ? ` / ${llm.provider}` : " / --"}
          {llm?.model_name ? ` / ${llm.model_name}` : " / --"}
        </p>
        <p>
          <span className="font-medium text-slate-600">Last connected</span>: {formatLocalTime(lastConnectedAt)}
        </p>
      </div>

      <div className="flex justify-end">
        <span className="card-link">자세히 보기 →</span>
      </div>
    </article>
  );
}

export default SystemCard;

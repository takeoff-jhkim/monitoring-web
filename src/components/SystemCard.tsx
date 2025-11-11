import { formatLocalTime } from "../utils/datetime";

export const STATUS_LABELS: Record<string, string> = {
  ready: "Ready",
  off: "Off",
  init: "Init",
  rag_building: "RAG Building",
  active: "Active",
  inactive: "Inactive",
  unknown: "Unknown",
};

export const HEALTH_LABELS: Record<string, string> = {
  HEALTHY: "Healthy",
  WARNING: "Warning",
  DEGRADED: "Degraded",
  CRITICAL: "Critical",
  UNKNOWN: "Unknown",
};

export const statusClass = (status: string | undefined) => {
  if (!status) return "status-init";
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "ready":
      return "status-ready";
    case "off":
      return "status-off";
    case "rag_building":
      return "status-rag";
    case "active":
      return "status-ready";
    case "inactive":
      return "status-off";
    case "unknown":
    case "init":
    default:
      return "status-init";
  }
};

export const healthStatusClass = (status: string | undefined | null) => {
  if (!status) return "status-init";
  const normalized = status.toUpperCase();
  switch (normalized) {
    case "HEALTHY":
      return "status-ready";
    case "WARNING":
    case "DEGRADED":
      return "status-rag";
    case "CRITICAL":
    case "FAILED":
      return "status-off";
    default:
      return "status-init";
  }
};

const formatPercent = (value?: number | null) =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${value.toFixed(1)}%`
    : "--";

type SystemCardProps = {
  apiKey: string;
  apiKeyDisplay?: string;
  name?: string;
  status?: string;
  healthStatus?: string | null;
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
  registeredAt?: string | null;
  lastSeenAt?: string | null;
  onClick?: () => void;
  isSelected?: boolean;
};

export function SystemCard({
  apiKey,
  apiKeyDisplay,
  name,
  status,
  healthStatus,
  cpuSeries,
  cpu,
  memory,
  storage,
  llm,
  lastConnectedAt,
  registeredAt,
  lastSeenAt,
  onClick,
  isSelected = false,
}: SystemCardProps) {
  const badgeStatus = (status ?? "init").toLowerCase();
  const healthBadge = healthStatus ?? null;
  const cardClasses = [
    "rounded-2xl shadow bg-white flex flex-col gap-4 transition-shadow",
    "px-6 py-5",
    "hover:shadow-lg focus-within:shadow-lg cursor-pointer",
    isSelected ? "ring-2 ring-offset-2 ring-sky-500" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const displayApiKey = apiKeyDisplay ?? apiKey;

  const healthLabel = healthBadge
    ? HEALTH_LABELS[healthBadge.toUpperCase()] ?? healthBadge
    : null;

  const clampPercent = (value?: number | null) =>
    typeof value === "number" && !Number.isNaN(value)
      ? Math.max(0, Math.min(100, value))
      : null;

  const metricItems: Array<{
    key: string;
    label: string;
    value: number | null | undefined;
  }> = [
    { key: "cpu", label: "CPU", value: cpu },
    { key: "memory", label: "Memory", value: memory },
    { key: "storage", label: "Storage", value: storage },
  ];

  return (
    <article
      className={cardClasses}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${apiKey} 시스템 상세 보기`}
      aria-pressed={isSelected}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-slate-900">{name ?? "--"}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`status-chip ${statusClass(badgeStatus)}`}>
            {STATUS_LABELS[badgeStatus] ?? badgeStatus}
          </span>
        </div>
      </div>

      <div className="metric-bars" aria-label="시스템 자원 사용량">
        {metricItems.map(({ key, label, value }) => {
          const normalized = clampPercent(value);
          return (
            <div className="metric-bar" key={key}>
              <div className="metric-bar-header">
                <span>{label}</span>
                <strong>{formatPercent(value)}</strong>
              </div>
              <div
                className={`metric-bar-track ${
                  normalized === null ? "metric-bar-track--empty" : ""
                }`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={normalized ?? undefined}
                aria-valuetext={
                  normalized === null ? `${label} 데이터 없음` : undefined
                }
              >
                {normalized !== null && (
                  <div
                    className="metric-bar-fill"
                    style={{ width: `${normalized}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>
          <span className="font-medium text-slate-600">LLM</span>:{" "}
          {llm?.mode ?? "--"}
          {llm?.provider ? ` / ${llm.provider}` : " / --"}
          {llm?.model_name ? ` / ${llm.model_name}` : " / --"}
        </p>
        <p>
          <span className="font-medium text-slate-600">Last connected</span>:{" "}
          {formatLocalTime(lastConnectedAt)}
        </p>
        <p>
          <span className="font-medium text-slate-600">Registered</span>:{" "}
          {formatDisplayDate(registeredAt)}
        </p>
        <p>
          <span className="font-medium text-slate-600">Last seen</span>:{" "}
          {formatDisplayDate(lastSeenAt)}
        </p>
      </div>
    </article>
  );
}

export default SystemCard;

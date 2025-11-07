export const statusPalette = {
  healthy: "#16a34a",
  stable: "#0f766e",
  degraded: "#d97706",
  incident: "#dc2626",
  ready: "#16a34a",
  off: "#ef4444",
  init: "#6366f1",
  rag_building: "#d97706",
  error: "#dc2626",
  running: "#2563eb",
  done: "#0f766e",
  idle: "#475467",
  executing: "#2563eb",
  planning: "#7c3aed",
  awaiting_input: "#f97316",
  suspended: "#6b7280",
};

export const formatStatusLabel = (value) =>
  value?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ??
  "Unknown";

export default function StatusPanel({ title, value, description }) {
  const color = statusPalette[value] || "#475467";

  return (
    <div className="card status-card">
      <div className="status-title">{title}</div>
      <div className="status-value" style={{ color }}>
        <span className="status-dot" style={{ backgroundColor: color }} />
        {formatStatusLabel(value)}
      </div>
      {description && <p className="status-desc">{description}</p>}
    </div>
  );
}

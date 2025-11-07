export const statusPalette = {
  healthy: "#16a34a",
  stable: "#0f766e",
  degraded: "#d97706",
  incident: "#dc2626",
  error: "#dc2626",
  executing: "#2563eb",
  planning: "#7c3aed",
  awaiting_input: "#f97316",
  idle: "#475467",
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

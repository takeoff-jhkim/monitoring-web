import React from "react";

function fmtUptime(sec) {
  if (!sec && sec !== 0) return "-";
  const s = Math.floor(Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function SystemCard({ system }) {
  const title = system?.name || system?.system_id || "unknown";
  const status = system?.status || "unknown";
  const uptime = fmtUptime(system?.uptime);
  const errorRate =
    typeof system?.error_rate === "number"
      ? `${(system.error_rate * 100).toFixed(2)}%`
      : system?.error_rate ?? "-";

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{title}</div>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100">
          {status}
        </span>
      </div>

      <div className="text-sm text-slate-600 space-y-1">
        <div>
          <span className="text-slate-500">ID:</span> {system?.system_id}
        </div>
        <div>
          <span className="text-slate-500">Uptime:</span> {uptime}
        </div>
        <div>
          <span className="text-slate-500">Error Rate:</span> {errorRate}
        </div>
      </div>

      <div className="mt-3 text-right">
        <a
          className="text-xs text-blue-600 hover:underline"
          href={`/systems/${encodeURIComponent(system?.system_id || "")}`}
        >
          상세 보기 →
        </a>
      </div>
    </div>
  );
}

import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString("ko-KR", {
    minute: "2-digit",
    second: "2-digit",
  });

export default function MetricChart({
  title,
  data,
  color = "#2563eb",
  unit = "%",
}) {
  const latest = data[data.length - 1];

  return (
    <div className="card metric-card">
      <div className="card-head">
        <div>
          <p className="card-label">{title}</p>
          <p className="card-value">
            {latest ? `${latest.value.toFixed(1)}${unit}` : "--"}
          </p>
        </div>
        <span className="card-subtle">
          {latest ? `업데이트: ${formatTime(latest.timestamp)}` : "데이터 대기 중"}
        </span>
      </div>

      <div className="chart-wrapper">
        {data.length === 0 ? (
          <div className="chart-placeholder">실시간 데이터 수집 중…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#E4E7EC" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tick={{ fill: "#98A2B3", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#98A2B3", fontSize: 11 }}
                width={32}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(value) => formatTime(value)}
                formatter={(value) => [`${value}${unit}`, title]}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#E4E7EC",
                  boxShadow: "0 8px 16px rgba(15, 23, 42, 0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

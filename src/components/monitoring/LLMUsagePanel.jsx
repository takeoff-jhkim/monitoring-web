export default function LLMUsagePanel({ usage }) {
  const toNumberString = (value) =>
    typeof value === "number" && !Number.isNaN(value)
      ? value.toLocaleString()
      : "--";

  const toFixedString = (value, digits = 4) =>
    typeof value === "number" && !Number.isNaN(value)
      ? value.toFixed(digits)
      : "--";

  const rows = [
    { label: "모드", value: usage.mode || "--" },
    { label: "프로바이더", value: usage.provider || "--" },
    { label: "모델", value: usage.model_name || "--" },
    { label: "프롬프트 토큰", value: toNumberString(usage.promptTokens) },
    { label: "응답 토큰", value: toNumberString(usage.completionTokens) },
    { label: "총 토큰", value: toNumberString(usage.totalTokens) },
    { label: "요청/분", value: usage.requestsPerMin ?? "--" },
    { label: "토큰/분", value: toNumberString(usage.tokensPerMin) },
    {
      label: "예상 비용 (USD)",
      value: `$${toFixedString(usage.costUsd)}`,
    },
  ];

  return (
    <div className="card llm-card">
      <div className="card-head">
        <div>
          <p className="card-label">LLM Usage</p>
          <p className="card-value">
            {usage.totalTokens
              ? `${usage.totalTokens.toLocaleString()} tokens`
              : usage.model_name || "--"}
          </p>
        </div>
        <span className="badge badge-soft">mock:llm_usage</span>
      </div>
      <dl className="llm-grid">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

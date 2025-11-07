export default function LLMUsagePanel({ usage }) {
  const rows = [
    { label: "프롬프트 토큰", value: usage.promptTokens.toLocaleString() },
    { label: "응답 토큰", value: usage.completionTokens.toLocaleString() },
    { label: "총 토큰", value: usage.totalTokens.toLocaleString() },
    { label: "요청/분", value: usage.requestsPerMin },
    { label: "토큰/분", value: usage.tokensPerMin.toLocaleString() },
    {
      label: "예상 비용 (USD)",
      value: `$${usage.costUsd.toFixed(4)}`,
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
              : "--"}
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

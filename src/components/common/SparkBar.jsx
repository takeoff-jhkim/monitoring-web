const WINDOW = 30;

export default function SparkBar({ points = [] }) {
  const trimmed = points.slice(-WINDOW);
  const padded = [
    ...Array(Math.max(0, WINDOW - trimmed.length)).fill(null),
    ...trimmed,
  ];

  if (padded.length === 0) {
    return <div className="sparkbar sparkbar--empty" />;
  }

  return (
    <div className="sparkbar" role="img" aria-label="최근 CPU 30포인트 막대">
      {padded.map((point, index) => {
        const value = point?.value ?? 0;
        const height = point ? Math.min(100, Math.max(4, value)) : 2;
        const isLatest = index === padded.length - 1;

        return (
          <span
            key={index}
            className={[
              "sparkbar-bar",
              point ? "" : "sparkbar-bar--gap",
              isLatest ? "sparkbar-bar--latest" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ height: `${height}%` }}
            title={point ? `${value.toFixed(1)}%` : "데이터 대기 중"}
          />
        );
      })}
    </div>
  );
}

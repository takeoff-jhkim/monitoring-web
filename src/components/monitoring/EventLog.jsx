const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const levelClass = {
  info: "badge-info",
  warning: "badge-warning",
  error: "badge-error",
};

export default function EventLog({ events }) {
  return (
    <div className="card events-card">
      <div className="card-head">
        <div>
          <p className="card-label">System Events</p>
          <p className="card-subtle">
            heartbeat/status/agent_status/llm_usage/system_event
          </p>
        </div>
        <span className="badge">{events.length} logs</span>
      </div>
      {events.length === 0 ? (
        <div className="chart-placeholder">이벤트를 기다리는 중…</div>
      ) : (
        <ul className="events-list">
          {events.map((event) => (
            <li key={event.id}>
              <div className="event-meta">
                <span className={`badge ${levelClass[event.level] || ""}`}>
                  {event.level}
                </span>
                <span className="event-channel">{event.channel}</span>
                <span className="event-time">{formatTime(event.timestamp)}</span>
              </div>
              <p>{event.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import PropTypes from "prop-types";

const normalizeStatusLabel = (status) =>
  typeof status === "string"
    ? status
        .toLowerCase()
        .split("_")
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ")
    : "Unknown";

const statusModifier = (status) =>
  typeof status === "string"
    ? status.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "unknown";

export default function AgentList({ agents }) {
  if (!agents || agents.length === 0) {
    return <p className="agent-status-empty">등록된 에이전트가 없습니다.</p>;
  }

  return (
    <ul className="agent-status-list">
      {agents.map((agent) => {
        const displayName = agent.name || agent.command || agent.id;
        const status = agent.status || "UNKNOWN";
        const statusClass = `agent-status-badge agent-status-badge--${statusModifier(status)}`;

        return (
          <li className="agent-status-row" key={agent.id}>
            <div className="agent-status-text">
              <p className="agent-status-name">{displayName}</p>
              {agent.command && (
                <p className="agent-status-command">{agent.command}</p>
              )}
            </div>
            <span className={statusClass}>{normalizeStatusLabel(status)}</span>
          </li>
        );
      })}
    </ul>
  );
}

AgentList.propTypes = {
  agents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      command: PropTypes.string,
      status: PropTypes.string,
    }),
  ),
};

AgentList.defaultProps = {
  agents: [],
};

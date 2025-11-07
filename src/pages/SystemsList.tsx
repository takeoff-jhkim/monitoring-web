import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SystemCard from "../components/SystemCard";
import { SYSTEM_DEFINITIONS } from "../config/systems";
import { useMonitoringStore } from "../store/useMonitoringStore";

const findDefinition = (apiKey: string) =>
  SYSTEM_DEFINITIONS.find((definition) => definition.apiKey === apiKey);

export default function SystemsList() {
  const navigate = useNavigate();
  const systems = useMonitoringStore((state) => state.byApi);

  const cards = useMemo(() => {
    const keys = new Set<string>();
    SYSTEM_DEFINITIONS.forEach((definition) => keys.add(definition.apiKey));
    Object.keys(systems).forEach((key) => keys.add(key));

    return Array.from(keys).map((apiKey) => {
      const bucket = systems[apiKey];
      const meta = bucket?.meta ?? findDefinition(apiKey);
      const cpuPoints = bucket?.metrics?.cpu ?? [];
      const memoryPoints = bucket?.metrics?.memory ?? [];
      const storagePoints = bucket?.metrics?.storage ?? [];
      const cpuSeries = cpuPoints.map((point) => point.value);
      const latestCpu = cpuPoints.length ? cpuPoints[cpuPoints.length - 1].value : null;
      const latestMemory = memoryPoints.length
        ? memoryPoints[memoryPoints.length - 1].value
        : null;
      const latestStorage = storagePoints.length
        ? storagePoints[storagePoints.length - 1].value
        : null;
      const status = bucket?.status?.status ?? "init";
      const llm = bucket?.llm ?? null;
      const lastConnectedAt = bucket?.status?.last_connected_at;

      return {
        apiKey,
        meta,
        status,
        cpuSeries,
        cpu: latestCpu,
        memory: latestMemory,
        storage: latestStorage,
        llm,
        lastConnectedAt,
      };
    });
  }, [systems]);

  return (
    <div className="systems-page max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Systems</h1>
        <p className="text-slate-500 text-sm">
          Redis 채널에 전달된 heartbeat/status/agent_status/llm_usage 스트림을 기반으로
          시스템 상태를 모니터링합니다.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <SystemCard
            key={card.apiKey}
            apiKey={card.apiKey}
            name={card.meta?.name}
            status={card.status}
            cpuSeries={card.cpuSeries}
            cpu={card.cpu}
            memory={card.memory}
            storage={card.storage}
            llm={card.llm}
            lastConnectedAt={card.lastConnectedAt}
            onClick={() => navigate(`/systems/${card.apiKey}`)}
          />
        ))}
      </section>
    </div>
  );
}

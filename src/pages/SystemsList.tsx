import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SystemCard from "../components/SystemCard";
import { SYSTEM_DEFINITIONS } from "../config/systems";
import { useMonitoringStore } from "../store/useMonitoringStore";
import { SystemDetailPanel } from "./SystemDetailPage";

const findDefinition = (apiKey: string) =>
  SYSTEM_DEFINITIONS.find((definition) => definition.apiKey === apiKey);

type RouteParams = {
  apiKey?: string;
};

export default function SystemsList() {
  const navigate = useNavigate();
  const { apiKey: routeApiKey } = useParams<RouteParams>();
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

  useEffect(() => {
    if (!routeApiKey && cards.length > 0) {
      navigate(`/systems/${cards[0].apiKey}`, { replace: true });
    }
  }, [routeApiKey, cards, navigate]);

  const selectedApiKey = routeApiKey ?? cards[0]?.apiKey;

  const handleSelect = (key: string) => {
    if (key === routeApiKey) return;
    navigate(`/systems/${key}`);
  };

  return (
    <div className="systems-workspace px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="flex w-full flex-col gap-4 lg:w-80 xl:w-96">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Systems</h1>
            <p className="text-sm text-slate-500">
              Redis 채널에 전달된 heartbeat/status/agent_status/llm_usage 스트림을 기반으로
              시스템 상태를 모니터링합니다.
            </p>
          </header>
          <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 200px)" }}>
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
                onClick={() => handleSelect(card.apiKey)}
                isSelected={card.apiKey === selectedApiKey}
              />
            ))}
          </div>
        </aside>

        <main className="flex-1">
          {selectedApiKey ? (
            <SystemDetailPanel apiKey={selectedApiKey} />
          ) : (
            <div className="card system-detail-empty">
              <p>시스템을 선택하면 오른쪽에서 상세 정보를 확인할 수 있습니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

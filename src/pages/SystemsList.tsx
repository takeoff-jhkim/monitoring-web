import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SystemCard from "../components/SystemCard";
import { systemsApi } from "../api/monitoring/systems";
import { SYSTEM_DEFINITIONS } from "../config/systems";
import { stopAllMocks } from "../utils/mockPublisher";
import { useSystemSubscription } from "../hooks/useSystemSubscription";
import { SystemMeta, useMonitoringStore } from "../store/useMonitoringStore";

const findDefinition = (apiKey: string) =>
  SYSTEM_DEFINITIONS.find((definition) => definition.apiKey === apiKey);

type ApiSystem = {
  api_key: string;
  system_name?: string;
  registered_at?: string;
  last_seen_at?: string;
};

const normaliseSystems = (payload: any): ApiSystem[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.systems)) return payload.systems;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const buildMetaPayload = (system: ApiSystem): SystemMeta => {
  const meta: SystemMeta = { apiKey: system.api_key };
  if (system.system_name) meta.name = system.system_name;
  if (system.registered_at) meta.registeredAt = system.registered_at;
  if (system.last_seen_at) meta.lastSeenAt = system.last_seen_at;

  const fallback = findDefinition(system.api_key);
  if (fallback?.description) meta.description = fallback.description;
  if (fallback?.owner) meta.owner = fallback.owner;
  if (fallback?.environment) meta.environment = fallback.environment;
  if (fallback?.region) meta.region = fallback.region;
  if (fallback?.model) meta.model = fallback.model;
  if (fallback?.tags) meta.tags = fallback.tags;
  if (fallback?.name && !system.system_name) meta.name = fallback.name;

  return meta;
};

function SystemListCard({
  apiKey,
  system,
  onClick,
}: {
  apiKey: string;
  system?: ApiSystem;
  onClick: () => void;
}) {
  useSystemSubscription(apiKey);

  const bucket = useMonitoringStore((state) => state.byApi[apiKey]);
  const meta = (bucket?.meta ?? {}) as SystemMeta;
  const cpuSeries = bucket?.metrics?.cpu ?? [];
  const memorySeries = bucket?.metrics?.memory ?? [];
  const storageSeries = bucket?.metrics?.storage ?? [];

  const cpuValues = cpuSeries.map((point) => point.value);
  const memory = memorySeries.length
    ? memorySeries[memorySeries.length - 1].value
    : null;
  const storage = storageSeries.length
    ? storageSeries[storageSeries.length - 1].value
    : null;
  const cpu = cpuValues.length ? cpuValues[cpuValues.length - 1] : null;
  const status = bucket?.status?.status ?? "init";
  const llm = bucket?.llm ?? null;
  const lastConnectedAt = bucket?.status?.last_connected_at ?? system?.last_seen_at;

  const registeredAt = meta?.registeredAt ?? system?.registered_at ?? undefined;
  const lastSeenAt = meta?.lastSeenAt ?? system?.last_seen_at ?? undefined;

  return (
    <SystemCard
      apiKey={apiKey}
      name={meta?.name ?? system?.system_name ?? findDefinition(apiKey)?.name}
      status={status}
      cpuSeries={cpuValues}
      cpu={cpu}
      memory={memory}
      storage={storage}
      llm={llm}
      registeredAt={registeredAt}
      lastSeenAt={lastSeenAt}
      lastConnectedAt={lastConnectedAt}
      onClick={onClick}
    />
  );
}

export default function SystemsList() {
  const navigate = useNavigate();
  const registerSystems = useMonitoringStore((state) => state.registerSystems);
  const systemsByApi = useMonitoringStore((state) => state.byApi);
  const [systems, setSystems] = useState<ApiSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    systemsApi
      .getSystemList(0, 20)
      .then((response) => {
        if (!active) return;
        const list = normaliseSystems(response);
        setSystems(list);
        if (list.length) {
          stopAllMocks();
          registerSystems(
            list
              .filter((item) => Boolean(item?.api_key))
              .map((item) => buildMetaPayload(item)),
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to fetch systems", err);
        setError("시스템 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [registerSystems]);

  const systemsMap = useMemo(() => {
    const map = new Map<string, ApiSystem>();
    systems.forEach((item) => {
      if (item?.api_key) {
        map.set(item.api_key, item);
      }
    });
    return map;
  }, [systems]);

  const cardKeys = useMemo(() => {
    const keys = systems
      .map((system) => system?.api_key)
      .filter((apiKey): apiKey is string => Boolean(apiKey));
    if (keys.length > 0) {
      return keys;
    }
    return Object.keys(systemsByApi);
  }, [systems, systemsByApi]);

  return (
    <div className="systems-page max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Systems</h1>
        <p className="text-slate-500 text-sm">
          Redis 채널에 전달된 heartbeat/status/agent_status/llm_usage 스트림을 기반으로
          시스템 상태를 모니터링합니다.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && cardKeys.length === 0 ? (
          <div className="col-span-full text-center text-sm text-slate-500 py-10">
            시스템 목록을 불러오는 중입니다...
          </div>
        ) : cardKeys.length === 0 ? (
          <div className="col-span-full text-center text-sm text-slate-500 py-10">
            표시할 시스템이 없습니다.
          </div>
        ) : (
          cardKeys.map((apiKey) => (
            <SystemListCard
              key={apiKey}
              apiKey={apiKey}
              system={systemsMap.get(apiKey)}
              onClick={() => navigate(`/systems/${apiKey}`)}
            />
          ))
        )}
      </section>
    </div>
  );
}

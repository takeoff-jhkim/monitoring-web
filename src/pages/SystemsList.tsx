import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SystemCard from "../components/SystemCard";
import { systemsApi } from "../api/monitoring/systems";
import {
  selectSelectedApiKey,
  selectSystemList,
  useMonitoringStore,
} from "../store/useMonitoringStore";
import { SystemDetailPanel } from "./SystemDetailPage";
import { monitoringSubscriptions } from "../utils/monitoringSubscriptions";

type CardModel = {
  apiKey: string;
  apiKeyDisplay: string;
  name: string;
  status: string;
  healthStatus: string | null;
  cpuSeries: number[];
  cpu: number | null;
  memory: number | null;
  storage: number | null;
  llm: any;
  lastConnectedAt: string | null | undefined;
  registeredAt: string | null | undefined;
  lastSeenAt: string | null | undefined;
};

const truncateApiKey = (apiKey: string) => {
  if (!apiKey) return "--";
  if (apiKey.length <= 18) return apiKey;
  return `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`;
};

const getLatestValue = (series: { value: number }[]) =>
  series && series.length ? series[series.length - 1].value : null;

const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="system-list-skeleton">
    {Array.from({ length: count }).map((_, index) => (
      <div className="system-card-skeleton" key={index}>
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--subtitle" />
        <div className="skeleton-metrics">
          <div className="skeleton-bar" />
          <div className="skeleton-meta">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        </div>
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    ))}
  </div>
);

export default function SystemsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const systemList = useMonitoringStore(selectSystemList);
  const selectedApiKey = useMonitoringStore(selectSelectedApiKey);
  const setSystemList = useMonitoringStore((state) => state.setSystemList);
  const setSelectedApiKey = useMonitoringStore(
    (state) => state.setSelectedApiKey,
  );
  const systemsByKey = useMonitoringStore((state) => state.byApi);
  const monitoredKeysRef = useRef<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    systemsApi
      .getSystemList(0, 20)
      .then((result) => {
        if (!isMounted) return;
        setSystemList(result.systems);
        setIsMock(result.isMock);
        if (result.isMock && result.error) {
          setErrorMessage(
            "시스템 목록을 불러오지 못해 샘플 데이터를 표시합니다.",
          );
        } else {
          setErrorMessage(null);
        }
        setLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Failed to load systems", error);
        setSystemList([]);
        setErrorMessage("시스템 목록을 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setSystemList]);

  useEffect(() => () => {
    monitoringSubscriptions.stopAll();
  }, []);

  const queryApiKey = searchParams.get("apiKey");

  useEffect(() => {
    if (loading) return;

    const firstSystemKey = systemList[0]?.apiKey ?? null;

    if (queryApiKey && queryApiKey !== selectedApiKey) {
      const exists = systemList.some((system) => system.apiKey === queryApiKey);
      if (exists) {
        setSelectedApiKey(queryApiKey);
      } else if (firstSystemKey) {
        setSelectedApiKey(firstSystemKey);
        setSearchParams({ apiKey: firstSystemKey }, { replace: true });
      }
    } else if (!queryApiKey && firstSystemKey) {
      setSelectedApiKey(firstSystemKey);
      setSearchParams({ apiKey: firstSystemKey }, { replace: true });
    } else if (!systemList.length) {
      if (selectedApiKey !== null) {
        setSelectedApiKey(null);
      }
    }
  }, [
    queryApiKey,
    selectedApiKey,
    setSelectedApiKey,
    setSearchParams,
    systemList,
    loading,
  ]);

  useEffect(() => {
    const nextKeys = systemList.map((system) => system.apiKey);
    const nextKeySet = new Set(nextKeys);
    const prevKeys = monitoredKeysRef.current;

    nextKeys.forEach((key) => {
      monitoringSubscriptions.start(key);
    });

    prevKeys.forEach((key) => {
      if (!nextKeySet.has(key)) {
        monitoringSubscriptions.stop(key);
      }
    });

    monitoredKeysRef.current = nextKeys;
  }, [systemList]);

  useEffect(() => {
    if (!selectedApiKey) return;
    const stop = monitoringSubscriptions.start(selectedApiKey);
    return () => {
      stop?.();
    };
  }, [selectedApiKey]);

  const cards: CardModel[] = useMemo(() => {
    return systemList.map((system) => {
      const bucket = systemsByKey[system.apiKey];
      const metrics = bucket?.metrics ?? { cpu: [], memory: [], storage: [] };
      const cpuSeries = metrics.cpu?.map((point) => point.value) ?? [];
      const memorySeries = metrics.memory ?? [];
      const storageSeries = metrics.storage ?? [];
      const statusSource =
        bucket?.status?.status ??
        (bucket?.meta?.status as string | null | undefined) ??
        system.status ??
        "init";
      const healthSource =
        (bucket?.meta?.healthStatus as string | null | undefined) ??
        system.healthStatus ??
        null;
      const lastConnectedAt = bucket?.status?.last_connected_at ?? null;
      const registeredAt =
        (bucket?.meta?.registeredAt as string | null | undefined) ??
        system.registeredAt ??
        null;
      const lastSeenAt =
        (bucket?.meta?.lastSeenAt as string | null | undefined) ??
        bucket?.status?.last_connected_at ??
        system.lastSeenAt ??
        null;
      const name =
        (bucket?.meta?.name as string | undefined) ??
        system.systemName ??
        system.apiKey;

      return {
        apiKey: system.apiKey,
        apiKeyDisplay: truncateApiKey(system.apiKey),
        name,
        status: statusSource ? statusSource.toString().toLowerCase() : "init",
        healthStatus: healthSource ? healthSource.toString() : null,
        cpuSeries,
        cpu: getLatestValue(metrics.cpu ?? []),
        memory: getLatestValue(memorySeries ?? []),
        storage: getLatestValue(storageSeries ?? []),
        llm: bucket?.llm ?? null,
        lastConnectedAt,
        registeredAt,
        lastSeenAt,
      };
    });
  }, [systemList, systemsByKey]);

  const handleSelect = (apiKey: string) => {
    setSelectedApiKey(apiKey);
    const next = new URLSearchParams(searchParams);
    next.set("apiKey", apiKey);
    setSearchParams(next, { replace: true });
  };

  const emptyState = !loading && (!systemList || systemList.length === 0);

  return (
    <div className="systems-workspace px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Systems</h1>
          <p className="text-sm text-slate-500">
            Redis 채널 기반 실시간 heartbeat, status, agent activity, LLM usage를
            모니터링합니다.
          </p>
        </header>

        {errorMessage && (
          <div className="alert alert-warning">
            {errorMessage}
            {isMock && <span className="alert-tag">Mock 데이터</span>}
          </div>
        )}

        <div className="systems-split grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-4 lg:gap-6">
          <section className="systems-list-pane">
            {loading ? (
              <ListSkeleton />
            ) : emptyState ? (
              <div className="card system-detail-empty">
                <p>등록된 시스템이 없습니다. API에 시스템을 추가해 주세요.</p>
              </div>
            ) : (
              <div className="systems-list">
                {cards.map((card) => (
                  <SystemCard
                    key={card.apiKey}
                    apiKey={card.apiKey}
                    apiKeyDisplay={card.apiKeyDisplay}
                    name={card.name}
                    status={card.status}
                    healthStatus={card.healthStatus}
                    cpuSeries={card.cpuSeries}
                    cpu={card.cpu}
                    memory={card.memory}
                    storage={card.storage}
                    llm={card.llm}
                    lastConnectedAt={card.lastConnectedAt ?? undefined}
                    registeredAt={card.registeredAt ?? null}
                    lastSeenAt={card.lastSeenAt ?? null}
                    onClick={() => handleSelect(card.apiKey)}
                    isSelected={selectedApiKey === card.apiKey}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="systems-detail-pane">
            {selectedApiKey ? (
              <SystemDetailPanel apiKey={selectedApiKey} />
            ) : (
              <div className="card system-detail-empty">
                <p>좌측에서 시스템을 선택하면 상세 상태를 확인할 수 있습니다.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

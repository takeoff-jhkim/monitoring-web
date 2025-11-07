import { useEffect, useState } from "react";

/** 공통 이벤트 인터페이스: { ts, type, api_key, data } */
export function useSystemsSSE(systemIds) {
  const [eventsBySystem, setEventsBySystem] = useState({}); // { [system_id]: RelayEvent[] }

  useEffect(() => {
    if (!systemIds || systemIds.length === 0) return;
    const idsParam = encodeURIComponent(systemIds.join(","));
    const es = new EventSource(`/sse/monitoring/systems?ids=${idsParam}`);

    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        const sid = ev.api_key;
        setEventsBySystem((prev) => {
          const list = (prev[sid] || []).concat(ev).slice(-50);
          return { ...prev, [sid]: list };
        });
      } catch {}
    };

    es.onerror = () => {
      // 네트워크/권한 문제 시 서버에서 4xx/5xx로 끊을 수 있음
      es.close();
    };

    return () => es.close();
  }, [Array.isArray(systemIds) ? systemIds.join(",") : ""]);

  return eventsBySystem;
}

import { useEffect } from "react";
import { startMockRedisPublisher } from "./mockPublisher";

export function useMockMonitoringPublisher(systems) {
  useEffect(() => {
    const stop = startMockRedisPublisher(systems);
    return () => {
      stop && stop();
    };
  }, [systems]);
}

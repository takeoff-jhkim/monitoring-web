import { useEffect } from "react";
import { startMockRedisPublisher } from "./mockPublisher";

export function useMockMonitoringPublisher() {
  useEffect(() => {
    const stop = startMockRedisPublisher();
    return () => {
      stop && stop();
    };
  }, []);
}

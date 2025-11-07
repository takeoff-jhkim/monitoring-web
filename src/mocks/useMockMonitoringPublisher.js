import { useEffect } from "react";
import { SYSTEM_DEFINITIONS } from "../config/systems";
import { startMockForAll, stopAllMocks } from "../utils/mockPublisher";

export function useMockMonitoringPublisher(systems = SYSTEM_DEFINITIONS) {
  useEffect(() => {
    startMockForAll(systems);
    return () => {
      stopAllMocks();
    };
  }, [systems]);
}

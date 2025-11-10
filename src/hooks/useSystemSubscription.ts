import { useEffect } from "react";
import { monitoringSubscriptionManager } from "../utils/systemSubscription";

export const useSystemSubscription = (apiKey?: string) => {
  useEffect(() => {
    if (!apiKey) return;
    const release = monitoringSubscriptionManager.subscribe(apiKey);
    return () => {
      release();
    };
  }, [apiKey]);
};

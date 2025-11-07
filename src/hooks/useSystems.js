import { useEffect, useState } from "react";

export function useSystems() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/monitoring/systems")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setSystems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setSystems([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { systems, loading };
}

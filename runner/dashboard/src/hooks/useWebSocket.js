import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const prevJsonRef = useRef('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const result = await res.json();
      const json = JSON.stringify(result);
      if (json !== prevJsonRef.current) {
        prevJsonRef.current = json;
        setData(result);
      }
      setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { data, connected };
}

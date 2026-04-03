import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocket() {
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const prevJsonRef = useRef('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      // Only update state if data actually changed (prevents unnecessary re-renders)
      const json = JSON.stringify(data);
      if (json !== prevJsonRef.current) {
        prevJsonRef.current = json;
        setStatus(data);
      }
      setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 2s — simple, reliable, works across ports
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, connected };
}

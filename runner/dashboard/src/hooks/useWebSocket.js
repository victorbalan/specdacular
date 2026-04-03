import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket() {
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const fetchInitialStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }, []);

  useEffect(() => {
    fetchInitialStatus();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(() => fetchInitialStatus(), 3000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (['task_registered', 'task_status_changed', 'stage_started',
           'stage_completed', 'live_progress'].includes(data.type)) {
        fetchInitialStatus();
      }
    };

    return () => ws.close();
  }, [fetchInitialStatus]);

  return { status, connected };
}

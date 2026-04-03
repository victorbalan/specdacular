import { useState, useEffect, useCallback } from 'react';

export function useIpc(channel, ...args) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await window.specd.invoke(channel, ...args);
    setData(result);
    setLoading(false);
  }, [channel, ...args]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}

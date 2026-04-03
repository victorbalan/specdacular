import { useState, useEffect, useRef, useCallback } from 'react';

export function LogViewer({ taskId, project }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevLineCountRef = useRef(0);

  // Track if user is scrolled near the bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 50;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    let interval;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/projects/${project}/tasks/${taskId}/logs?tail=500`);
        const data = await res.json();
        const newLines = data.lines || [];
        // Only update state if lines actually changed
        if (newLines.length !== prevLineCountRef.current) {
          prevLineCountRef.current = newLines.length;
          setLines(newLines);
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };

    fetchLogs();
    interval = setInterval(fetchLogs, 1500);
    return () => clearInterval(interval);
  }, [taskId]);

  // Only auto-scroll if user was already at the bottom
  useEffect(() => {
    if (isNearBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  if (loading) return <p className="text-gray-500 text-sm">Loading logs...</p>;
  if (lines.length === 0) return <p className="text-gray-500 text-sm">No logs yet. Waiting for agent output...</p>;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="bg-gray-900 rounded p-3 mt-3 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed"
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            line.startsWith('--- Stage:') ? 'text-blue-400 font-bold mt-2 mb-1' :
            line.startsWith('[stderr]') ? 'text-red-400' :
            'text-gray-300 whitespace-pre-wrap'
          }
        >
          {line}
        </div>
      ))}
    </div>
  );
}

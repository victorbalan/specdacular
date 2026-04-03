import { useState, useEffect, useRef, useCallback } from 'react';

export function LogViewer({ taskId, project }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevLineCountRef = useRef(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  }, []);

  useEffect(() => {
    let interval;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/projects/${project}/tasks/${taskId}/logs?tail=500`);
        const data = await res.json();
        const newLines = data.lines || [];
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
  }, [taskId, project]);

  useEffect(() => {
    if (isNearBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  if (loading) return (
    <p className="text-zinc-600 text-[10px] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      loading...
    </p>
  );

  if (lines.length === 0) return (
    <p className="text-zinc-600 text-[10px] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      waiting for output...
    </p>
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="bg-zinc-950 rounded border border-zinc-800/40 p-2 mt-2 max-h-48 overflow-y-auto"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={`text-[10px] leading-relaxed ${
            line.startsWith('--- Stage:') ? 'text-sky-400 font-medium mt-1.5 mb-0.5' :
            line.startsWith('[stderr]') ? 'text-red-400/70' :
            'text-zinc-500 whitespace-pre-wrap'
          }`}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

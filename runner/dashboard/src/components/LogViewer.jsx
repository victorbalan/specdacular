import { useState, useEffect, useRef } from 'react';

export function LogViewer({ taskId }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    let interval;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/logs?tail=500`);
        const data = await res.json();
        setLines(data.lines || []);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };

    fetchLogs();
    interval = setInterval(fetchLogs, 1000); // poll every 1s for live feel
    return () => clearInterval(interval);
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (loading) return <p className="text-gray-500 text-sm">Loading logs...</p>;
  if (lines.length === 0) return <p className="text-gray-500 text-sm">No logs yet. Waiting for agent output...</p>;

  return (
    <div className="bg-gray-900 rounded p-3 mt-3 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed">
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
      <div ref={bottomRef} />
    </div>
  );
}

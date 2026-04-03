import { useEffect, useRef } from 'react';

export default function LogViewer({ lines }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        padding: 16,
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.5,
        maxHeight: 400,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {lines?.length > 0 ? lines.join('\n') : 'No logs yet.'}
    </div>
  );
}

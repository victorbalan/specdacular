import { useState, useEffect, useRef } from 'react';

export default function TaskDetailOverlay({ task, onClose }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    async function load() {
      const s = await window.specd.invoke('get-project-status', task.projectId);
      setStatus(s?.tasks?.[task.id] || null);
      const l = await window.specd.invoke('get-task-logs', task.projectId, task.id);
      setLogs(l?.lines || []);
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [task.projectId, task.id]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRetry = async () => {
    await window.specd.invoke('retry-task', task.projectId, task.id);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff', borderRadius: 12, padding: 24,
          width: '80%', maxWidth: 720, maxHeight: '85vh', overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>{task.name}</h2>
            <span style={{
              display: 'inline-block', backgroundColor: '#e8e8e8', borderRadius: 4,
              padding: '1px 6px', fontSize: 11, color: '#666', marginTop: 4,
            }}>
              {task.projectName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', cursor: 'pointer', fontSize: 22, color: '#999',
              backgroundColor: 'transparent', padding: '4px 8px',
            }}
          >
            x
          </button>
        </div>

        {task.description && (
          <p style={{ margin: '0 0 16px', color: '#666', fontSize: 14 }}>{task.description}</p>
        )}

        <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
          Status: <strong>{status?.status || task.status}</strong>
          {status?.pipeline && <> | Pipeline: {status.pipeline}</>}
        </div>

        {status?.pr_url && (
          <div style={{ marginBottom: 12 }}>
            <a href={status.pr_url} style={{ color: '#2196f3' }}>View PR</a>
          </div>
        )}

        {(status?.status === 'failed' || task.status === 'failed') && (
          <button onClick={handleRetry} style={{
            padding: '6px 16px', marginBottom: 16, borderRadius: 6,
            border: '1px solid #f44336', color: '#f44336', backgroundColor: '#fff', cursor: 'pointer',
          }}>
            Retry
          </button>
        )}

        {status?.stages?.length > 0 && (
          <>
            <h4 style={{ margin: '0 0 8px' }}>Stages</h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {status.stages.map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: 10, borderRadius: 6,
                  border: `2px solid ${
                    s.status === 'success' ? '#4caf50' :
                    s.status === 'failure' ? '#f44336' :
                    s.status === 'running' ? '#2196f3' : '#e0e0e0'
                  }`,
                  backgroundColor: s.status === 'running' ? '#e3f2fd' : '#fff',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.stage}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{s.agent}</div>
                  <div style={{ fontSize: 12, color: s.status === 'success' ? '#4caf50' : s.status === 'failure' ? '#f44336' : '#2196f3' }}>
                    {s.status}
                  </div>
                  {s.duration != null && <div style={{ fontSize: 11, color: '#999' }}>{s.duration}s</div>}
                  {s.live_progress && (
                    <div style={{ fontSize: 11, color: '#2196f3', marginTop: 4 }}>
                      {s.live_progress.progress} ({s.live_progress.percent}%)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <h4 style={{ margin: '0 0 8px' }}>Logs</h4>
        <div
          ref={logRef}
          style={{
            backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 8,
            fontFamily: 'monospace', fontSize: 11, maxHeight: 300, overflow: 'auto',
            whiteSpace: 'pre-wrap', lineHeight: 1.5,
          }}
        >
          {logs.length > 0 ? logs.join('\n') : 'No logs yet.'}
        </div>
      </div>
    </div>
  );
}

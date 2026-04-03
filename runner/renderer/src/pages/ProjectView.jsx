import { useState, useEffect, useCallback } from 'react';
import TaskList from '../components/TaskList';

export default function ProjectView({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const loadTasks = useCallback(async () => {
    const result = await window.specd.invoke('get-tasks', projectId);
    setTasks(result || []);
  }, [projectId]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 3000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>Tasks</h2>
        <TaskList tasks={tasks} onSelect={setSelectedTaskId} selectedTaskId={selectedTaskId} />
      </div>
      {selectedTaskId && (
        <div style={{ width: 480, borderLeft: '1px solid #e0e0e0', overflow: 'auto' }}>
          <TaskDetailPanel projectId={projectId} taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
        </div>
      )}
    </div>
  );
}

function TaskDetailPanel({ projectId, taskId, onClose }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const s = await window.specd.invoke('get-project-status', projectId);
      setStatus(s?.tasks?.[taskId] || null);
      const l = await window.specd.invoke('get-task-logs', projectId, taskId);
      setLogs(l?.lines || []);
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [projectId, taskId]);

  const handleRetry = async () => {
    await window.specd.invoke('retry-task', projectId, taskId);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{status?.name || taskId}</h3>
        <button onClick={onClose} style={{ border: 'none', cursor: 'pointer', fontSize: 18 }}>x</button>
      </div>

      {status && (
        <>
          <div style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>
            Status: <strong>{status.status}</strong> | Pipeline: {status.pipeline}
          </div>

          {status.pr_url && (
            <div style={{ marginBottom: 12 }}>
              <a href={status.pr_url} style={{ color: '#2196f3' }}>View PR</a>
            </div>
          )}

          {status.status === 'failed' && (
            <button onClick={handleRetry} style={{
              padding: '6px 16px', marginBottom: 16, borderRadius: 6,
              border: '1px solid #f44336', color: '#f44336', backgroundColor: '#fff', cursor: 'pointer',
            }}>
              Retry
            </button>
          )}

          <h4>Stages</h4>
          {status.stages?.map((s, i) => (
            <div key={i} style={{ padding: 8, marginBottom: 4, borderRadius: 4, border: '1px solid #e0e0e0' }}>
              <strong>{s.stage}</strong> — {s.status}
              {s.summary && <div style={{ fontSize: 12, color: '#666' }}>{s.summary}</div>}
              {s.duration != null && <div style={{ fontSize: 11, color: '#999' }}>{s.duration}s</div>}
            </div>
          ))}
        </>
      )}

      <h4>Logs</h4>
      <div style={{
        backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 8,
        fontFamily: 'monospace', fontSize: 11, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap',
      }}>
        {logs.length > 0 ? logs.join('\n') : 'No logs yet.'}
      </div>
    </div>
  );
}

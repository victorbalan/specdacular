import { useState, useEffect, useCallback } from 'react';

const COLUMNS = [
  { key: 'ready', label: 'Queued', color: '#ff9800', statuses: ['ready', 'queued'] },
  { key: 'in_progress', label: 'Running', color: '#2196f3', statuses: ['in_progress'] },
  { key: 'done', label: 'Done', color: '#4caf50', statuses: ['done'] },
  { key: 'failed', label: 'Failed', color: '#f44336', statuses: ['failed'] },
];

export default function Dashboard({ projects }) {
  const [allTasks, setAllTasks] = useState([]);

  const loadAllTasks = useCallback(async () => {
    if (!projects?.length) { setAllTasks([]); return; }
    const tasksByProject = await Promise.all(
      projects.map(async (p) => {
        const tasks = await window.specd.invoke('get-tasks', p.id);
        return (tasks || []).map(t => ({ ...t, projectName: p.name, projectId: p.id }));
      })
    );
    setAllTasks(tasksByProject.flat());
  }, [projects]);

  useEffect(() => {
    loadAllTasks();
    const interval = setInterval(loadAllTasks, 3000);
    return () => clearInterval(interval);
  }, [loadAllTasks]);

  if (!projects || projects.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px' }}>Dashboard</h1>
        <p style={{ color: '#888' }}>No projects registered. Click + in the sidebar to add one.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ margin: '0 0 16px' }}>Dashboard</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
        gap: 12,
        flex: 1,
        minHeight: 0,
      }}>
        {COLUMNS.map(col => {
          const tasks = allTasks.filter(t => col.statuses.includes(t.status));
          return (
            <div key={col.key} style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 200,
              overflow: 'auto',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${col.color}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{col.label}</span>
                <span style={{
                  backgroundColor: col.color, color: '#fff', borderRadius: 12,
                  padding: '2px 8px', fontSize: 12, fontWeight: 600,
                }}>
                  {tasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map(t => (
                  <TaskCard key={t.id} task={t} />
                ))}
                {tasks.length === 0 && (
                  <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 16 }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: 6,
      padding: 10,
      border: '1px solid #e0e0e0',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{task.name}</div>
      <span style={{
        display: 'inline-block',
        backgroundColor: '#e8e8e8',
        borderRadius: 4,
        padding: '1px 6px',
        fontSize: 11,
        color: '#666',
      }}>
        {task.projectName}
      </span>
      {task.description && (
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, lineHeight: 1.3 }}>
          {task.description.length > 80 ? task.description.slice(0, 80) + '...' : task.description}
        </div>
      )}
    </div>
  );
}

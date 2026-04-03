import { useState, useEffect, useCallback } from 'react';
import KanbanBoard from '../components/KanbanBoard';

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
      <KanbanBoard tasks={allTasks} projects={projects} onRefresh={loadAllTasks} />
    </div>
  );
}

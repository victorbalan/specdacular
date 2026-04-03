import { useState, useEffect, useCallback } from 'react';
import KanbanBoard from '../components/KanbanBoard';

export default function ProjectView({ projectId, projectName }) {
  const [tasks, setTasks] = useState([]);

  const loadTasks = useCallback(async () => {
    const result = await window.specd.invoke('get-tasks', projectId);
    setTasks((result || []).map(t => ({ ...t, projectName, projectId })));
  }, [projectId, projectName]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 3000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ margin: '0 0 16px' }}>{projectName}</h1>
      <KanbanBoard tasks={tasks} />
    </div>
  );
}

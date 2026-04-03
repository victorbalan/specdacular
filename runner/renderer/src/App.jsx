import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const loadProjects = useCallback(async () => {
    const result = await window.specd.invoke('get-projects');
    setProjects(result || []);
  }, []);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, [loadProjects]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      <Sidebar projects={projects} selectedId={selectedId} onSelect={setSelectedId} onRefresh={loadProjects} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {selectedId === null && <Dashboard projects={projects} />}
        {selectedId === 'settings' && <div style={{ padding: 24 }}><h1>Settings</h1><p>Coming soon</p></div>}
        {selectedId && selectedId !== 'settings' && (
          <ProjectView projectId={selectedId} projectName={projects.find(p => p.id === selectedId)?.name || 'Project'} />
        )}
      </main>
    </div>
  );
}

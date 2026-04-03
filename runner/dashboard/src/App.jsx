import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { BoardView } from './components/BoardView';

function getCounts(tasks) {
  return {
    running: tasks.filter(t => t.status === 'in_progress').length,
    queued: tasks.filter(t => t.status === 'queued' || t.status === 'ready').length,
    done: tasks.filter(t => t.status === 'done').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };
}

export default function App() {
  const { data, connected } = useWebSocket();
  const [activeProject, setActiveProject] = useState(null); // null = all

  const projects = data?.projects ? Object.entries(data.projects) : [];

  // Build per-project task lists
  const projectTasks = {};
  const allTasks = [];
  for (const [projectName, projectState] of projects) {
    projectTasks[projectName] = [];
    for (const [id, task] of Object.entries(projectState.tasks || {})) {
      const t = { id, ...task, project: projectName };
      projectTasks[projectName].push(t);
      allTasks.push(t);
    }
  }

  const visibleTasks = activeProject ? (projectTasks[activeProject] || []) : allTasks;
  const totalCounts = getCounts(allTasks);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              specd-runner
            </h1>

            {/* Project filter tabs */}
            <div className="flex items-center gap-1 text-xs">
              {/* All tab */}
              <button
                onClick={() => setActiveProject(null)}
                className={`px-2.5 py-1 rounded transition-all ${
                  activeProject === null
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                }`}
              >
                <span>All</span>
                <Stats counts={totalCounts} mini />
              </button>

              {/* Per-project tabs */}
              {projects.map(([name]) => {
                const counts = getCounts(projectTasks[name] || []);
                const isActive = activeProject === name;
                return (
                  <button
                    key={name}
                    onClick={() => setActiveProject(isActive ? null : name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                      isActive
                        ? 'bg-zinc-700/60 text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                    }`}
                  >
                    <span>{name}</span>
                    <Stats counts={counts} mini />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Global stats */}
            <div className="flex items-center gap-3 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {totalCounts.running > 0 && (
                <span className="text-amber-400">{totalCounts.running} running</span>
              )}
              {totalCounts.queued > 0 && (
                <span className="text-zinc-500">{totalCounts.queued} queued</span>
              )}
              {totalCounts.failed > 0 && (
                <span className="text-red-400">{totalCounts.failed} failed</span>
              )}
              <span className="text-zinc-600">{totalCounts.done} done</span>
            </div>

            {/* Connection */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse-glow' : 'bg-red-400'}`} />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {connected ? 'live' : 'offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden">
        {visibleTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No tasks</p>
              <p className="text-sm">Add YAML files to .specd/runner/tasks/</p>
            </div>
          </div>
        ) : (
          <BoardView tasks={visibleTasks} />
        )}
      </main>
    </div>
  );
}

function Stats({ counts, mini }) {
  if (!counts) return null;
  const parts = [];
  if (counts.running > 0) parts.push({ n: counts.running, color: 'bg-amber-400' });
  if (counts.failed > 0) parts.push({ n: counts.failed, color: 'bg-red-400' });
  if (counts.queued > 0) parts.push({ n: counts.queued, color: 'bg-zinc-500' });
  if (counts.done > 0) parts.push({ n: counts.done, color: 'bg-emerald-500' });

  if (parts.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-1.5">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className={`w-1 h-1 rounded-full ${p.color}`} />
          <span className="text-[9px] text-zinc-600 tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {p.n}
          </span>
        </span>
      ))}
    </span>
  );
}

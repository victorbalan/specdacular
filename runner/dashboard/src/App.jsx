import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { BoardView } from './components/BoardView';

export default function App() {
  const { data, connected } = useWebSocket();

  const projects = data?.projects ? Object.entries(data.projects) : [];

  // Aggregate all tasks across projects
  const allTasks = [];
  for (const [projectName, projectState] of projects) {
    for (const [id, task] of Object.entries(projectState.tasks || {})) {
      allTasks.push({ id, ...task, project: projectName });
    }
  }

  const counts = {
    draft: allTasks.filter(t => t.status === 'draft').length,
    queued: allTasks.filter(t => t.status === 'queued' || t.status === 'ready').length,
    in_progress: allTasks.filter(t => t.status === 'in_progress').length,
    done: allTasks.filter(t => t.status === 'done').length,
    failed: allTasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              specd-runner
            </h1>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              {projects.map(([name]) => (
                <span key={name} className="px-2 py-0.5 rounded bg-zinc-800/50 text-zinc-400">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {counts.in_progress > 0 && (
                <span className="text-amber-400">{counts.in_progress} running</span>
              )}
              {counts.queued > 0 && (
                <span className="text-zinc-500">{counts.queued} queued</span>
              )}
              {counts.failed > 0 && (
                <span className="text-red-400">{counts.failed} failed</span>
              )}
              <span className="text-zinc-600">{counts.done} done</span>
            </div>

            {/* Connection indicator */}
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
        {allTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No tasks</p>
              <p className="text-sm">Add YAML files to .specd/runner/tasks/</p>
            </div>
          </div>
        ) : (
          <BoardView tasks={allTasks} />
        )}
      </main>
    </div>
  );
}

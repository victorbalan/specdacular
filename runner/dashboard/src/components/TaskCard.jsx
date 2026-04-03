import { useState } from 'react';
import { StageTimeline } from './StageTimeline';
import { LogViewer } from './LogViewer';

export function TaskCard({ task, column }) {
  const [expanded, setExpanded] = useState(task.status === 'in_progress');
  const [showLogs, setShowLogs] = useState(false);

  const handleAction = async (action) => {
    await fetch(`/api/projects/${task.project}/tasks/${task.id}/${action}`, { method: 'POST' });
  };

  const currentStage = task.stages?.find(s => s.status === 'running');
  const progress = currentStage?.live_progress;

  return (
    <div
      className="animate-slide-in rounded-lg border border-zinc-800/60 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all cursor-pointer group"
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: column.accent + '40',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-3 py-3">
        {/* Project label */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {task.project}
          </span>
          {task.pr_url && task.pr_url !== 'none' && (
            <a
              href={task.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              PR #{task.pr_url.split('/').pop()}
            </a>
          )}
        </div>

        {/* Task name */}
        <h3 className="text-sm font-medium text-zinc-200 leading-snug mb-2">
          {task.name}
        </h3>

        {/* Live progress bar */}
        {progress && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-amber-400/80 truncate max-w-[80%]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {progress.progress}
              </span>
              <span className="text-[10px] text-zinc-600 tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {progress.percent}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1">
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percent}%`,
                  backgroundColor: column.accent,
                }}
              />
            </div>
          </div>
        )}

        {/* Stage dots */}
        {task.stages && task.stages.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {task.stages.map((stage, i) => (
              <div
                key={i}
                title={`${stage.stage}: ${stage.status}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  stage.status === 'success' ? 'bg-emerald-400' :
                  stage.status === 'running' ? 'bg-amber-400 animate-pulse-glow' :
                  stage.status === 'failure' ? 'bg-red-400' :
                  'bg-zinc-700'
                }`}
              />
            ))}
            <span className="text-[9px] text-zinc-600 ml-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {currentStage?.stage || task.current_stage || ''}
            </span>
          </div>
        )}

        {/* Task ID */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-zinc-700"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {task.id}
          </span>
          {task.stages?.length > 0 && (
            <span className="text-[10px] text-zinc-700 tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {task.stages.filter(s => s.status === 'success').length}/{task.stages.length}
            </span>
          )}
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-zinc-800/40 px-3 py-3" onClick={e => e.stopPropagation()}>
          {task.stages && task.stages.length > 0 && (
            <StageTimeline stages={task.stages} />
          )}

          <div className="flex gap-1.5 mt-3">
            {task.status === 'failed' && (
              <button
                onClick={() => handleAction('retry')}
                className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                retry
              </button>
            )}
            {(task.status === 'failed' || task.status === 'in_progress') && (
              <button
                onClick={() => handleAction('skip')}
                className="text-[10px] px-2 py-1 rounded bg-zinc-700/30 text-zinc-500 hover:bg-zinc-700/50 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                skip
              </button>
            )}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-[10px] px-2 py-1 rounded bg-zinc-700/30 text-zinc-500 hover:bg-zinc-700/50 transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {showLogs ? 'hide logs' : 'logs'}
            </button>
          </div>

          {showLogs && <LogViewer taskId={task.id} project={task.project} />}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { StageTimeline } from './StageTimeline';
import { LogViewer } from './LogViewer';

const STATUS_COLORS = {
  done: 'border-green-500/30 bg-green-500/5',
  in_progress: 'border-yellow-500/30 bg-yellow-500/5',
  failed: 'border-red-500/30 bg-red-500/5',
  queued: 'border-gray-600/30 bg-gray-600/5',
  draft: 'border-gray-700/30 bg-gray-800/5',
};

const STATUS_BADGES = {
  done: { text: 'Done', class: 'bg-green-500/20 text-green-400' },
  in_progress: { text: 'Running', class: 'bg-yellow-500/20 text-yellow-400' },
  failed: { text: 'Failed', class: 'bg-red-500/20 text-red-400' },
  queued: { text: 'Queued', class: 'bg-gray-500/20 text-gray-400' },
  draft: { text: 'Draft', class: 'bg-gray-700/20 text-gray-500' },
};

export function TaskCard({ id, task }) {
  const isActive = task.status === 'in_progress' || task.status === 'failed';
  const [expanded, setExpanded] = useState(isActive);
  const [showLogs, setShowLogs] = useState(isActive);

  const color = STATUS_COLORS[task.status] || STATUS_COLORS.queued;
  const badge = STATUS_BADGES[task.status] || STATUS_BADGES.queued;

  const handleAction = async (action) => {
    await fetch(`/api/tasks/${id}/${action}`, { method: 'POST' });
  };

  return (
    <div className={`border rounded-lg p-4 ${color} transition-all`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-mono text-xs">{id}</span>
          <h3 className="font-medium">{task.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
            {badge.text}
          </span>
          <span className="text-gray-500">{expanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          {task.stages && task.stages.length > 0 && (
            <StageTimeline stages={task.stages} />
          )}

          <div className="flex gap-2 mt-3">
            {task.status === 'failed' && (
              <button
                onClick={() => handleAction('retry')}
                className="text-xs px-3 py-1 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
              >
                Retry
              </button>
            )}
            {(task.status === 'failed' || task.status === 'in_progress') && (
              <button
                onClick={() => handleAction('skip')}
                className="text-xs px-3 py-1 rounded bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
              >
                Skip
              </button>
            )}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs px-3 py-1 rounded bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          </div>

          {showLogs && <LogViewer taskId={id} />}
        </div>
      )}
    </div>
  );
}

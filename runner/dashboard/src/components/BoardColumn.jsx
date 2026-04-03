import { TaskCard } from './TaskCard';

export function BoardColumn({ column, tasks, count }) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col h-full">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: column.accent }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {column.label}
          </span>
        </div>
        <span
          className="text-[10px] font-medium text-zinc-600 tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-4">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-zinc-700 text-xs">
            No tasks
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard key={`${task.project}-${task.id}`} task={task} column={column} />
          ))
        )}
      </div>
    </div>
  );
}

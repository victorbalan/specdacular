import { useWebSocket } from './hooks/useWebSocket';
import { TaskCard } from './components/TaskCard';

export default function App() {
  const { status, connected } = useWebSocket();

  const tasks = status?.tasks ? Object.entries(status.tasks) : [];

  const sortOrder = { in_progress: 0, queued: 1, failed: 2, done: 3 };
  tasks.sort((a, b) => (sortOrder[a[1].status] ?? 4) - (sortOrder[b[1].status] ?? 4));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Specdacular Runner</h1>
          {status?.started_at && (
            <p className="text-sm text-gray-500 mt-1">
              Started {new Date(status.started_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No tasks yet</p>
          <p className="text-sm mt-2">Add YAML files to .specd/runner/tasks/ to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(([id, task]) => (
            <TaskCard key={id} id={id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useWebSocket } from './hooks/useWebSocket';
import { TaskCard } from './components/TaskCard';

const sortOrder = { in_progress: 0, queued: 1, failed: 2, done: 3, draft: 4 };

export default function App() {
  const { data, connected } = useWebSocket();

  const projects = data?.projects ? Object.entries(data.projects) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Specdacular Runner</h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No projects registered</p>
          <p className="text-sm mt-2">Run "specd-runner register" from a project directory</p>
        </div>
      ) : (
        projects.map(([projectName, projectState]) => {
          const tasks = Object.entries(projectState.tasks || {});
          tasks.sort((a, b) => (sortOrder[a[1].status] ?? 4) - (sortOrder[b[1].status] ?? 4));

          return (
            <div key={projectName} className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-300">{projectName}</h2>
              <div className="space-y-3">
                {tasks.map(([id, task]) => (
                  <TaskCard key={id} id={id} task={task} project={projectName} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

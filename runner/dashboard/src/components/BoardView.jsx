import { BoardColumn } from './BoardColumn';

const STAGE_COLUMNS = [
  { id: 'queued', label: 'Queued', accent: 'rgb(113, 113, 122)' },
  { id: 'plan', label: 'Plan', accent: 'rgb(56, 189, 248)' },
  { id: 'research', label: 'Research', accent: 'rgb(139, 92, 246)' },
  { id: 'investigate', label: 'Investigate', accent: 'rgb(139, 92, 246)' },
  { id: 'implement', label: 'Implement', accent: 'rgb(251, 191, 36)' },
  { id: 'fix', label: 'Fix', accent: 'rgb(251, 191, 36)' },
  { id: 'test', label: 'Test', accent: 'rgb(14, 165, 233)' },
  { id: 'review', label: 'Review', accent: 'rgb(167, 139, 250)' },
  { id: 'review-plan', label: 'Review Plan', accent: 'rgb(167, 139, 250)' },
  { id: 'done', label: 'Done', accent: 'rgb(52, 211, 153)' },
  { id: 'failed', label: 'Failed', accent: 'rgb(248, 113, 113)' },
];

function getTaskColumn(task) {
  // Done/failed tasks go to their own column
  if (task.status === 'done') return 'done';
  if (task.status === 'failed') return 'failed';

  // Queued/draft/ready tasks haven't started
  if (task.status === 'queued' || task.status === 'ready' || task.status === 'draft') return 'queued';

  // In-progress tasks: use the current_stage
  if (task.current_stage) return task.current_stage;

  // Fallback: check the last stage in the stages array
  if (task.stages && task.stages.length > 0) {
    const last = task.stages[task.stages.length - 1];
    if (last.status === 'running') return last.stage;
  }

  return 'queued';
}

export function BoardView({ tasks }) {
  // Figure out which columns have tasks
  const tasksByColumn = {};
  for (const task of tasks) {
    const col = getTaskColumn(task);
    if (!tasksByColumn[col]) tasksByColumn[col] = [];
    tasksByColumn[col].push(task);
  }

  // Build visible columns: only show columns that have tasks OR are well-known stages
  // Always show queued + done, show others only if they have tasks
  const visibleColumns = STAGE_COLUMNS.filter(col => {
    if (col.id === 'queued' || col.id === 'done') return true;
    return tasksByColumn[col.id]?.length > 0;
  });

  // Check for any stages not in our predefined list
  for (const colId of Object.keys(tasksByColumn)) {
    if (!visibleColumns.find(c => c.id === colId)) {
      visibleColumns.splice(visibleColumns.length - 2, 0, {
        id: colId,
        label: colId.charAt(0).toUpperCase() + colId.slice(1),
        accent: 'rgb(161, 161, 170)',
      });
    }
  }

  return (
    <div className="flex h-full overflow-x-auto px-4 py-4 gap-3">
      {visibleColumns.map(col => {
        const columnTasks = (tasksByColumn[col.id] || [])
          .sort((a, b) => (a.priority || 99) - (b.priority || 99));

        return (
          <BoardColumn
            key={col.id}
            column={col}
            tasks={columnTasks}
            count={columnTasks.length}
          />
        );
      })}
    </div>
  );
}

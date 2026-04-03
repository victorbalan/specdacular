import { BoardColumn } from './BoardColumn';

const COLUMNS = [
  { id: 'draft', label: 'Draft', statuses: ['draft'], color: 'zinc', accent: 'rgb(113, 113, 122)' },
  { id: 'queued', label: 'Queued', statuses: ['queued', 'ready'], color: 'sky', accent: 'rgb(56, 189, 248)' },
  { id: 'in_progress', label: 'In Progress', statuses: ['in_progress'], color: 'amber', accent: 'rgb(251, 191, 36)' },
  { id: 'review', label: 'Review', statuses: ['review', 'planning'], color: 'violet', accent: 'rgb(167, 139, 250)' },
  { id: 'done', label: 'Done', statuses: ['done'], color: 'emerald', accent: 'rgb(52, 211, 153)' },
  { id: 'failed', label: 'Failed', statuses: ['failed'], color: 'red', accent: 'rgb(248, 113, 113)' },
];

export function BoardView({ tasks }) {
  // Filter out columns with no tasks (except in_progress which always shows)
  const activeColumns = COLUMNS.filter(col => {
    if (col.id === 'in_progress') return true;
    return tasks.some(t => col.statuses.includes(t.status));
  });

  return (
    <div className="flex h-full overflow-x-auto px-4 py-4 gap-3">
      {activeColumns.map(col => {
        const columnTasks = tasks
          .filter(t => col.statuses.includes(t.status))
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

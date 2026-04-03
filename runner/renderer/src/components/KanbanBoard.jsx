import { useState } from 'react';
import { colors, radius, shadows } from '../theme';
import TaskDetailOverlay from './TaskDetailOverlay';

const COLUMNS = [
  { key: 'ready', label: 'Queued', color: colors.warning, statuses: ['ready', 'queued'] },
  { key: 'in_progress', label: 'Running', color: colors.accent, statuses: ['in_progress'] },
  { key: 'done', label: 'Done', color: colors.success, statuses: ['done'] },
  { key: 'failed', label: 'Failed', color: colors.danger, statuses: ['failed'] },
];

export default function KanbanBoard({ tasks }) {
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
        gap: 12,
        flex: 1,
        minHeight: 0,
      }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => col.statuses.includes(t.status));
          return (
            <div key={col.key} style={{
              backgroundColor: colors.bg,
              borderRadius: radius.md,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 200,
              overflow: 'auto',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${col.color}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{col.label}</span>
                <span style={{
                  backgroundColor: col.color, color: '#fff', borderRadius: 10,
                  padding: '1px 8px', fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: 'center',
                }}>
                  {colTasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colTasks.map(t => (
                  <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: 24 }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailOverlay task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}

function TaskCard({ task, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        padding: '10px 12px',
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadows.md; e.currentTarget.style.borderColor = colors.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = shadows.sm; e.currentTarget.style.borderColor = colors.border; }}
    >
      <div style={{ fontWeight: 500, fontSize: 13, color: colors.text, marginBottom: 6 }}>{task.name}</div>
      <span style={{
        display: 'inline-block',
        backgroundColor: colors.bg,
        borderRadius: radius.sm,
        padding: '1px 6px',
        fontSize: 10,
        fontWeight: 500,
        color: colors.textSecondary,
      }}>
        {task.projectName}
      </span>
      {task.description && (
        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 1.4 }}>
          {task.description.length > 80 ? task.description.slice(0, 80) + '...' : task.description}
        </div>
      )}
    </div>
  );
}

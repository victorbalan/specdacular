import { useState } from 'react';
import { colors, radius, shadows } from '../theme';
import TaskDetailOverlay from './TaskDetailOverlay';

const COLUMNS = [
  { key: 'idea', label: 'Ideas', color: '#868e96', statuses: ['idea'] },
  { key: 'planning', label: 'Planning', color: '#cc5de8', statuses: ['planning'] },
  { key: 'review', label: 'Review', color: '#fcc419', statuses: ['review'] },
  { key: 'ready', label: 'Queued', color: colors.warning, statuses: ['ready', 'queued'] },
  { key: 'in_progress', label: 'Running', color: colors.accent, statuses: ['in_progress'] },
  { key: 'done', label: 'Done', color: colors.success, statuses: ['done'] },
  { key: 'failed', label: 'Failed', color: colors.danger, statuses: ['failed'] },
];

const ACTION_MAP = {
  idea: { label: 'Plan', action: 'plan' },
  review: { label: 'Approve', action: 'approve' },
  failed: { label: 'Retry', action: 'retry' },
};

export default function KanbanBoard({ tasks, projectId, projects, onRefresh }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [ideaText, setIdeaText] = useState('');
  const [ideaProject, setIdeaProject] = useState(projectId || projects?.[0]?.id || '');

  const handleAddIdea = async () => {
    const text = ideaText.trim();
    if (!text) return;
    const pid = projectId || ideaProject;
    if (!pid) return;
    await window.specd.invoke('create-idea', pid, text);
    setIdeaText('');
    if (onRefresh) onRefresh();
  };

  const handleAction = async (task, action, feedback) => {
    await window.specd.invoke('advance-task', task.projectId, task.id, action, feedback || '');
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(140px, 1fr))`,
        gap: 10,
        flex: 1,
        minHeight: 0,
        overflowX: 'auto',
      }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => col.statuses.includes(t.status));
          const isIdeasCol = col.key === 'idea';

          return (
            <div key={col.key} style={{
              backgroundColor: colors.surfaceHover,
              borderRadius: radius.md,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 200,
              overflow: 'auto',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${col.color}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: colors.text }}>{col.label}</span>
                <span style={{
                  backgroundColor: col.color, color: '#fff', borderRadius: 10,
                  padding: '1px 7px', fontSize: 10, fontWeight: 600, minWidth: 18, textAlign: 'center',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {isIdeasCol && (
                <div style={{ marginBottom: 8 }}>
                  {!projectId && projects?.length > 1 && (
                    <select
                      value={ideaProject}
                      onChange={(e) => setIdeaProject(e.target.value)}
                      style={{
                        width: '100%', padding: '5px 8px', marginBottom: 4,
                        backgroundColor: colors.surface, color: colors.text,
                        border: `1px solid ${colors.border}`, borderRadius: radius.sm,
                        fontSize: 11, outline: 'none',
                      }}
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddIdea(); }}
                    placeholder="Add an idea..."
                    style={{
                      width: '100%', padding: '6px 8px',
                      backgroundColor: colors.surface, color: colors.text,
                      border: `1px solid ${colors.border}`, borderRadius: radius.sm,
                      fontSize: 12, outline: 'none',
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    action={ACTION_MAP[t.status]}
                    onClick={() => setSelectedTask(t)}
                    onAction={(action) => handleAction(t, action)}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', padding: 20 }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailOverlay
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAdvance={(action, feedback) => {
            handleAction(selectedTask, action, feedback).then(() => setSelectedTask(null));
          }}
        />
      )}
    </>
  );
}

function TaskCard({ task, action, onClick, onAction }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        padding: '8px 10px',
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadows.md; e.currentTarget.style.borderColor = colors.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = shadows.sm; e.currentTarget.style.borderColor = colors.border; }}
    >
      <div style={{ fontWeight: 500, fontSize: 12, color: colors.text, marginBottom: 4 }}>{task.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          backgroundColor: colors.bg, borderRadius: radius.sm,
          padding: '1px 5px', fontSize: 10, fontWeight: 500, color: colors.textSecondary,
        }}>
          {task.projectName}
        </span>
        {action && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction(action.action); }}
            style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 600,
              border: `1px solid ${colors.accent}`, borderRadius: radius.sm,
              backgroundColor: 'transparent', color: colors.accent, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accent; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.accent; }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

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
  const [showAddModal, setShowAddModal] = useState(false);

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
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {isIdeasCol && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      style={{
                        width: 20, height: 20, border: 'none', borderRadius: radius.sm,
                        cursor: 'pointer', backgroundColor: colors.surface,
                        color: colors.textSecondary, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 14, lineHeight: '18px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accent; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.surface; e.currentTarget.style.color = colors.textSecondary; }}
                    >
                      +
                    </button>
                  )}
                  <span style={{
                    backgroundColor: col.color, color: '#fff', borderRadius: 10,
                    padding: '1px 7px', fontSize: 10, fontWeight: 600, minWidth: 18, textAlign: 'center',
                  }}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    action={ACTION_MAP[t.status]}
                    onClick={() => setSelectedTask(t)}
                    onAction={(action) => handleAction(t, action)}
                    onRefresh={onRefresh}
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

      {showAddModal && (
        <AddIdeaModal
          projectId={projectId}
          projects={projects}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); if (onRefresh) onRefresh(); }}
        />
      )}

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

function AddIdeaModal({ projectId, projects, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [autoExecute, setAutoExecute] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projectId || projects?.[0]?.id || '');

  const handleSubmit = async () => {
    const name = title.trim();
    if (!name) return;
    const pid = projectId || selectedProject;
    if (!pid) return;
    await window.specd.invoke('create-idea', pid, name, description.trim(), autoExecute);
    onCreated();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colors.surface, borderRadius: radius.lg, padding: 24,
          width: 440, boxShadow: shadows.overlay,
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: colors.text }}>
          New Idea
        </h3>

        {!projectId && projects?.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px',
                backgroundColor: colors.bg, color: colors.text,
                border: `1px solid ${colors.border}`, borderRadius: radius.sm,
                fontSize: 13, outline: 'none',
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
            placeholder="What's the idea?"
            autoFocus
            style={{
              width: '100%', padding: '8px 10px',
              backgroundColor: colors.bg, color: colors.text,
              border: `1px solid ${colors.border}`, borderRadius: radius.sm,
              fontSize: 13, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: colors.textSecondary, marginBottom: 4, display: 'block' }}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="More detail about what you want to build..."
            rows={4}
            style={{
              width: '100%', padding: '8px 10px',
              backgroundColor: colors.bg, color: colors.text,
              border: `1px solid ${colors.border}`, borderRadius: radius.sm,
              fontSize: 13, outline: 'none', resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
          fontSize: 13, color: colors.textSecondary, cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
            style={{ accentColor: colors.accent }}
          />
          Auto-execute (plan → review → queue → run automatically)
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', border: `1px solid ${colors.border}`, borderRadius: radius.md,
              cursor: 'pointer', backgroundColor: 'transparent', color: colors.textSecondary, fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '7px 16px', border: 'none', borderRadius: radius.md,
              cursor: 'pointer', backgroundColor: colors.accent, color: '#fff', fontSize: 13,
            }}
          >
            Add Idea
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, action, onClick, onAction, onRefresh }) {
  const handleToggleAuto = async (e) => {
    e.stopPropagation();
    await window.specd.invoke('toggle-auto-execute', task.projectId, task.id);
    if (onRefresh) onRefresh();
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        padding: '8px 10px',
        border: `1px solid ${task.auto_execute ? colors.accent : colors.border}`,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadows.md; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = shadows.sm; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontWeight: 500, fontSize: 12, color: colors.text }}>{task.name}</div>
        {(task.status === 'idea' || task.status === 'planning' || task.status === 'review') && (
          <span
            onClick={handleToggleAuto}
            title={task.auto_execute ? 'Auto-execute ON' : 'Auto-execute OFF'}
            style={{
              fontSize: 10, cursor: 'pointer', padding: '1px 4px', borderRadius: 3,
              backgroundColor: task.auto_execute ? colors.accentLight : 'transparent',
              color: task.auto_execute ? colors.accent : colors.textMuted,
            }}
          >
            {task.auto_execute ? 'AUTO' : ''}
          </span>
        )}
      </div>
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
      {task.pr_url && (
        <a
          href={task.pr_url}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'block', marginTop: 4, fontSize: 10, color: colors.accent,
            textDecoration: 'none',
          }}
        >
          PR →
        </a>
      )}
    </div>
  );
}

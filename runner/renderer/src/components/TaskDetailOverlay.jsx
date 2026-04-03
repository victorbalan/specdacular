import { useState, useEffect, useRef } from 'react';
import { colors, radius, shadows } from '../theme';

const STAGE_COLORS = {
  success: colors.success,
  failure: colors.danger,
  running: colors.accent,
};

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function TaskDetailOverlay({ task, onClose }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    async function load() {
      const s = await window.specd.invoke('get-project-status', task.projectId);
      setStatus(s?.tasks?.[task.id] || null);
      const l = await window.specd.invoke('get-task-logs', task.projectId, task.id);
      setLogs(l?.lines || []);
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [task.projectId, task.id]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleRetry = async () => {
    await window.specd.invoke('retry-task', task.projectId, task.id);
  };

  const currentStatus = status?.status || task.status;

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
          backgroundColor: colors.surface, borderRadius: radius.lg, padding: 0,
          width: '80%', maxWidth: 720, maxHeight: '85vh', overflow: 'hidden',
          boxShadow: shadows.overlay, display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: colors.text }}>{task.name}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
              <span style={{
                backgroundColor: colors.bg, borderRadius: radius.sm,
                padding: '2px 8px', fontSize: 11, fontWeight: 500, color: colors.textSecondary,
              }}>
                {task.projectName}
              </span>
              <StatusBadge status={currentStatus} />
              {status?.pipeline && (
                <span style={{ fontSize: 12, color: colors.textMuted }}>
                  {status.pipeline}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', cursor: 'pointer', backgroundColor: 'transparent',
              color: colors.textMuted, padding: 4, display: 'flex', borderRadius: radius.sm,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
          {task.description && (
            <p style={{ margin: '0 0 20px', color: colors.textSecondary, fontSize: 14, lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}

          {status?.pr_url && (
            <a href={status.pr_url} style={{
              display: 'inline-block', color: colors.accent, fontSize: 13,
              marginBottom: 16, textDecoration: 'none',
            }}>
              View Pull Request →
            </a>
          )}

          {currentStatus === 'failed' && (
            <button onClick={handleRetry} style={{
              padding: '7px 16px', marginBottom: 20, borderRadius: radius.md,
              border: `1px solid ${colors.danger}`, color: colors.danger,
              backgroundColor: colors.surface, cursor: 'pointer', fontSize: 13,
              transition: 'all 0.15s ease',
            }}>
              Retry task
            </button>
          )}

          {/* Stages */}
          {status?.stages?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: colors.text }}>Stages</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                {status.stages.map((s, i) => (
                  <div key={i} style={{
                    flex: 1, padding: 10, borderRadius: radius.md,
                    border: `1px solid ${STAGE_COLORS[s.status] || colors.border}`,
                    backgroundColor: s.status === 'running' ? colors.accentLight : colors.surface,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: colors.text }}>{s.stage}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{s.agent}</div>
                    <div style={{ fontSize: 11, color: STAGE_COLORS[s.status] || colors.textMuted, marginTop: 2, fontWeight: 500 }}>
                      {s.status}
                    </div>
                    {s.duration != null && (
                      <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{s.duration}s</div>
                    )}
                    {s.live_progress && (
                      <div style={{ fontSize: 10, color: colors.accent, marginTop: 4 }}>
                        {s.live_progress.progress} ({s.live_progress.percent}%)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: colors.text }}>Logs</h4>
          <div
            ref={logRef}
            style={{
              backgroundColor: '#111213', color: '#ced4da', padding: 14, borderRadius: radius.md,
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontSize: 11, maxHeight: 300, overflow: 'auto',
              whiteSpace: 'pre-wrap', lineHeight: 1.6,
            }}
          >
            {logs.length > 0 ? logs.join('\n') : 'No logs yet.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ready: { bg: colors.warningLight, color: colors.warning, label: 'Queued' },
    queued: { bg: colors.warningLight, color: colors.warning, label: 'Queued' },
    in_progress: { bg: colors.accentLight, color: colors.accent, label: 'Running' },
    done: { bg: colors.successLight, color: colors.success, label: 'Done' },
    failed: { bg: colors.dangerLight, color: colors.danger, label: 'Failed' },
  };
  const s = map[status] || { bg: colors.bg, color: colors.textMuted, label: status };
  return (
    <span style={{
      backgroundColor: s.bg, color: s.color, borderRadius: 10,
      padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

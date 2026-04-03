import { useState } from 'react';
import { colors, radius, shadows } from '../theme';

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export default function Sidebar({ projects, selectedId, onSelect, onRefresh }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAdd = async () => {
    const result = await window.specd.invoke('register-project');
    if (result) onRefresh();
  };

  const handleDelete = async (id) => {
    await window.specd.invoke('unregister-project', id);
    setConfirmDelete(null);
    if (selectedId === id) onSelect(null);
    onRefresh();
  };

  const navItem = (active) => ({
    padding: '8px 12px',
    border: 'none',
    borderRadius: radius.sm,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    color: active ? colors.sidebarTextActive : colors.sidebarText,
    backgroundColor: active ? colors.sidebarActive : 'transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <aside style={{
      width: 240,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      backgroundColor: colors.sidebar,
      color: colors.sidebarText,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 8px 16px',
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: colors.sidebarTextActive, letterSpacing: '-0.02em' }}>
          Specd Runner
        </span>
        <button
          onClick={handleAdd}
          title="Add project"
          style={{
            width: 26, height: 26, border: 'none', borderRadius: radius.sm,
            cursor: 'pointer', backgroundColor: colors.sidebarHover,
            color: colors.sidebarText, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.sidebarActive; e.currentTarget.style.color = colors.sidebarTextActive; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.sidebarHover; e.currentTarget.style.color = colors.sidebarText; }}
        >
          <IconPlus />
        </button>
      </div>

      <button onClick={() => onSelect(null)} style={navItem(selectedId === null)}>
        Dashboard
      </button>

      <div style={{ height: 1, backgroundColor: colors.sidebarHover, margin: '8px 0' }} />

      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textMuted, padding: '4px 12px 4px' }}>
        Projects
      </div>

      {projects?.map(p => (
        <div
          key={p.id}
          onMouseEnter={() => setHoveredId(p.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            display: 'flex', alignItems: 'center', borderRadius: radius.sm,
            backgroundColor: selectedId === p.id ? colors.sidebarActive : 'transparent',
            transition: 'background-color 0.15s ease',
          }}
        >
          <button
            onClick={() => onSelect(p.id)}
            style={{
              ...navItem(selectedId === p.id),
              flex: 1, backgroundColor: 'transparent',
            }}
          >
            <div style={{ marginBottom: 1 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>
              {p.taskCounts?.running || 0} running / {p.taskCounts?.total || 0} total
            </div>
          </button>
          {hoveredId === p.id && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
              title="Remove project"
              style={{
                border: 'none', cursor: 'pointer', backgroundColor: 'transparent',
                color: colors.textMuted, padding: '4px 8px', display: 'flex', alignItems: 'center',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.danger}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
            >
              <IconTrash />
            </button>
          )}
        </div>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <div style={{ height: 1, backgroundColor: colors.sidebarHover, margin: '0 0 8px' }} />
        <button onClick={() => onSelect('pipelines')} style={navItem(selectedId === 'pipelines')}>
          Pipelines
        </button>
        <button onClick={() => onSelect('settings')} style={navItem(selectedId === 'settings')}>
          Settings
        </button>
      </div>

      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            backgroundColor: colors.surface, borderRadius: radius.lg, padding: 24,
            maxWidth: 360, boxShadow: shadows.overlay,
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Remove project?</h3>
            <p style={{ margin: '0 0 20px', color: colors.textSecondary, fontSize: 14 }}>
              Remove <strong>{confirmDelete.name}</strong> from Specd Runner? This won't delete any files.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '7px 16px', border: `1px solid ${colors.border}`, borderRadius: radius.md,
                  cursor: 'pointer', backgroundColor: colors.surface, fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                style={{
                  padding: '7px 16px', border: 'none', borderRadius: radius.md,
                  cursor: 'pointer', backgroundColor: colors.danger, color: '#fff', fontSize: 13,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

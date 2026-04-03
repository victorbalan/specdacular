import { useState } from 'react';

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

  return (
    <aside style={{
      width: 240,
      borderRight: '1px solid #e0e0e0',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      backgroundColor: '#fafafa',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 16px' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Specd Runner</h2>
        <button
          onClick={handleAdd}
          title="Add project"
          style={{
            width: 28, height: 28, border: '1px solid #ccc', borderRadius: 6,
            cursor: 'pointer', backgroundColor: '#fff', fontSize: 18, lineHeight: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>

      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '8px 12px',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          textAlign: 'left',
          backgroundColor: selectedId === null ? '#e8e8e8' : 'transparent',
        }}
      >
        Dashboard
      </button>

      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

      {projects?.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          onMouseEnter={() => setHoveredId(p.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            backgroundColor: selectedId === p.id ? '#e8e8e8' : 'transparent',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {p.taskCounts?.running || 0} running / {p.taskCounts?.total || 0} total
            </div>
          </div>
          {hoveredId === p.id && (
            <span
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
              title="Remove project"
              style={{ fontSize: 14, cursor: 'pointer', color: '#999', padding: '0 4px' }}
            >
              🗑
            </span>
          )}
        </button>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          onClick={() => onSelect('settings')}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            backgroundColor: selectedId === 'settings' ? '#e8e8e8' : 'transparent',
          }}
        >
          Settings
        </button>
      </div>

      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 24,
            maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 8px' }}>Remove project?</h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
              Remove <strong>{confirmDelete.name}</strong> from Specd Runner? This won't delete any files.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6,
                  cursor: 'pointer', backgroundColor: '#fff',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                style={{
                  padding: '8px 16px', border: 'none', borderRadius: 6,
                  cursor: 'pointer', backgroundColor: '#f44336', color: '#fff',
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

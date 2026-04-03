export default function Sidebar({ projects, selectedId, onSelect }) {
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
      <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Specd Runner</h2>

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
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            backgroundColor: selectedId === p.id ? '#e8e8e8' : 'transparent',
          }}
        >
          <div style={{ fontWeight: 500 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {p.taskCounts?.running || 0} running / {p.taskCounts?.total || 0} total
          </div>
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
    </aside>
  );
}

const STATUS_ICONS = { done: '✓', in_progress: '▸', failed: '✗', ready: '○', queued: '○', draft: '·' };
const STATUS_COLORS = { done: '#4caf50', in_progress: '#2196f3', failed: '#f44336', ready: '#ff9800', queued: '#999' };

export default function TaskList({ tasks, onSelect, selectedTaskId }) {
  if (!tasks || tasks.length === 0) {
    return <p style={{ color: '#888' }}>No tasks yet.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {tasks.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: selectedTaskId === t.id ? '#f0f0f0' : '#fff',
          }}
        >
          <div>
            <span style={{ color: STATUS_COLORS[t.status], marginRight: 8 }}>
              {STATUS_ICONS[t.status] || '?'}
            </span>
            <span style={{ fontWeight: 500 }}>{t.name}</span>
          </div>
          <span style={{ fontSize: 12, color: '#888' }}>{t.id}</span>
        </button>
      ))}
    </div>
  );
}

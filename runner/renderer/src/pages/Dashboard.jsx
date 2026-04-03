export default function Dashboard({ projects }) {
  const running = projects?.reduce((sum, p) => sum + (p.taskCounts?.running || 0), 0) || 0;
  const queued = projects?.reduce((sum, p) => sum + (p.taskCounts?.ready || 0), 0) || 0;
  const done = projects?.reduce((sum, p) => sum + (p.taskCounts?.done || 0), 0) || 0;
  const failed = projects?.reduce((sum, p) => sum + (p.taskCounts?.failed || 0), 0) || 0;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 24px' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Running" value={running} color="#2196f3" />
        <StatCard label="Queued" value={queued} color="#ff9800" />
        <StatCard label="Done" value={done} color="#4caf50" />
        <StatCard label="Failed" value={failed} color="#f44336" />
      </div>

      <h2 style={{ margin: '0 0 16px' }}>Projects</h2>
      {(!projects || projects.length === 0) ? (
        <p style={{ color: '#888' }}>
          No projects registered. Run <code>specd runner register &lt;path&gt;</code> to add one.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {projects.map(p => (
            <div key={p.id} style={{
              padding: 16,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{p.path}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                <span>{p.taskCounts?.running || 0} running</span>
                <span>{p.taskCounts?.done || 0} done</span>
                <span>{p.taskCounts?.failed || 0} failed</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 8,
      border: '1px solid #e0e0e0',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 14, color: '#666' }}>{label}</div>
    </div>
  );
}

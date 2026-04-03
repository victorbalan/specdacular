const STAGE_COLORS = { success: '#4caf50', failure: '#f44336', running: '#2196f3' };

export default function StageProgress({ stages }) {
  if (!stages || stages.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {stages.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          padding: 12,
          borderRadius: 8,
          border: `2px solid ${STAGE_COLORS[s.status] || '#e0e0e0'}`,
          backgroundColor: s.status === 'running' ? '#e3f2fd' : '#fff',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.stage}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{s.agent}</div>
          <div style={{ fontSize: 12, color: STAGE_COLORS[s.status] }}>{s.status}</div>
          {s.duration != null && (
            <div style={{ fontSize: 11, color: '#999' }}>{s.duration}s</div>
          )}
          {s.live_progress && (
            <div style={{ fontSize: 11, color: '#2196f3', marginTop: 4 }}>
              {s.live_progress.progress} ({s.live_progress.percent}%)
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

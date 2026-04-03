export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      <aside style={{ width: 240, borderRight: '1px solid #e0e0e0', padding: 16 }}>
        <h2>Specd Runner</h2>
        <p>Projects will appear here</p>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <h1>Dashboard</h1>
        <p>No projects registered yet.</p>
      </main>
    </div>
  );
}

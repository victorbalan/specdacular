import { useState, useEffect } from 'react';
import { colors, radius } from '../theme';

export default function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [agents, setAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('pipelines');

  useEffect(() => {
    window.specd.invoke('get-pipeline-files').then(setPipelines);
    window.specd.invoke('get-agent-files').then(setAgents);
  }, []);

  const items = activeTab === 'pipelines' ? pipelines : agents;

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600 }}>Pipelines & Agents</h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {['pipelines', 'agents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px', borderRadius: radius.sm, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
              backgroundColor: activeTab === tab ? colors.accent : colors.surface,
              color: activeTab === tab ? '#fff' : colors.textSecondary,
              transition: 'all 0.15s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', flex: 1 }}>
        {items.map(item => (
          <div key={item.name} style={{
            backgroundColor: colors.surface, borderRadius: radius.md,
            border: `1px solid ${colors.border}`, overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
              fontWeight: 600, fontSize: 13, color: colors.text,
            }}>
              {item.name}
            </div>
            <pre style={{
              padding: 14, margin: 0, fontSize: 11, lineHeight: 1.6,
              color: '#ced4da', backgroundColor: '#111213',
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              overflow: 'auto', maxHeight: 300,
            }}>
              {JSON.stringify(item.content, null, 2)}
            </pre>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ color: colors.textMuted, textAlign: 'center', padding: 40 }}>
            No {activeTab} found.
          </div>
        )}
      </div>
    </div>
  );
}

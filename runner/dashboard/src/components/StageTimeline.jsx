const STATUS_STYLES = {
  success: { icon: '✓', color: 'text-green-400', bg: 'bg-green-400/10' },
  running: { icon: '▸', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  failure: { icon: '✗', color: 'text-red-400', bg: 'bg-red-400/10' },
  pending: { icon: '○', color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export function StageTimeline({ stages }) {
  return (
    <div className="space-y-2 mt-3">
      {stages.map((stage, i) => {
        const style = STATUS_STYLES[stage.status] || STATUS_STYLES.pending;
        return (
          <div key={i} className={`flex items-start gap-3 px-3 py-2 rounded ${style.bg}`}>
            <span className={`${style.color} font-mono text-sm mt-0.5`}>{style.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{stage.stage}</span>
                <span className="text-xs text-gray-500">
                  {stage.agent && <span className="mr-2">{stage.agent}</span>}
                  {stage.duration != null && <span>{stage.duration}s</span>}
                </span>
              </div>
              {stage.summary && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{stage.summary}</p>
              )}
              {stage.live_progress && (
                <div className="mt-1">
                  <p className="text-xs text-yellow-300">{stage.live_progress.progress}</p>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${stage.live_progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

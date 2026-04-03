const STATUS_ICONS = {
  success: { char: '\u2713', color: 'text-emerald-400' },
  running: { char: '\u25B8', color: 'text-amber-400' },
  failure: { char: '\u2717', color: 'text-red-400' },
};

export function StageTimeline({ stages }) {
  return (
    <div className="space-y-1">
      {stages.map((stage, i) => {
        const icon = STATUS_ICONS[stage.status] || { char: '\u25CB', color: 'text-zinc-600' };
        return (
          <div key={i} className="flex items-start gap-2 py-1">
            <span className={`${icon.color} text-xs mt-px`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {icon.char}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {stage.stage}
                </span>
                <div className="flex items-center gap-2">
                  {stage.agent && (
                    <span className="text-[10px] text-zinc-600"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stage.agent}
                    </span>
                  )}
                  {stage.duration != null && (
                    <span className="text-[10px] text-zinc-700 tabular-nums"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stage.duration}s
                    </span>
                  )}
                </div>
              </div>
              {stage.summary && (
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{stage.summary}</p>
              )}
              {stage.live_progress && (
                <div className="mt-1">
                  <p className="text-[10px] text-amber-400/70"
                     style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {stage.live_progress.progress}
                  </p>
                  <div className="w-full bg-zinc-800 rounded-full h-0.5 mt-1">
                    <div
                      className="bg-amber-400 h-0.5 rounded-full transition-all duration-300"
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

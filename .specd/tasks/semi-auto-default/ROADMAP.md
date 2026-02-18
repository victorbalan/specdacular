# Roadmap: semi-auto-default

## Phases

| Phase | Title | Tasks | Dependencies |
|-------|-------|-------|--------------|
| 1 | Core Logic Changes | 7 | — |
| 2 | Documentation Updates | 3 | Phase 1 |

## Execution Order

```
Phase 1: Core Logic Changes
├── pipeline.json
├── brain.md
├── continue.md (workflow)
├── brain-routing.md
├── execute-hooks.md
├── resolve-pipeline.md
└── continue.md (command)
         │
         ▼
Phase 2: Documentation Updates
├── STATE-MACHINE.md
├── HELP.md
└── README.md
```

## Success Criteria

- [ ] No references to `interactive` mode, `--semi-auto` flag, `pause_in_semi_auto`, or `enabled` field in any shipped file
- [ ] `pipeline.json` uses `pause` field, no `mode` or `enabled`
- [ ] Brain handles two modes: default (pause-based) and `--auto`
- [ ] All docs reflect the new system

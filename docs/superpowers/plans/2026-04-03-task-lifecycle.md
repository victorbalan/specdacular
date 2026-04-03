# Task Lifecycle + Brainstorm Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-column kanban with a 7-column task lifecycle (Ideas → Planning → Review → Queued → Running → Done → Failed) powered by a brainstorm pipeline that auto-researches and writes specs.

**Architecture:** New agent templates (researcher, brainstormer) and a brainstorm pipeline are added to bootstrap defaults. The orchestrator gains an `advance-task` method that triggers the brainstorm pipeline for ideas and moves tasks between lifecycle states. The StageSequencer is extended to pass stage output as context to subsequent stages. The kanban board expands to 7 columns with a quick-add input and per-column card actions. A new Pipelines page shows pipeline/agent JSON files read-only.

**Tech Stack:** Electron, React, Express, Node.js built-ins

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `runner/renderer/src/pages/Pipelines.jsx` | Read-only viewer for pipeline and agent template JSON files |

### Modified files

| File | Change |
|------|--------|
| `runner/main/bootstrap.js` | Add brainstorm pipeline + researcher/brainstormer agent templates |
| `runner/main/pipeline/sequencer.js` | Pass previous stage result as context to next stage |
| `runner/main/orchestrator.js` | Add `advanceTask(taskId, action, feedback)` method |
| `runner/main/ipc.js` | Add `create-idea`, `advance-task`, `get-pipeline-files`, `get-agent-files` handlers |
| `runner/preload.js` | Whitelist new IPC channels |
| `runner/renderer/src/components/KanbanBoard.jsx` | 7 columns, quick-add input, card action buttons |
| `runner/renderer/src/components/TaskDetailOverlay.jsx` | Spec viewer, Approve/Re-plan buttons |
| `runner/renderer/src/components/Sidebar.jsx` | Add Pipelines nav item |
| `runner/renderer/src/pages/Dashboard.jsx` | Pass projects list to KanbanBoard for quick-add project picker |
| `runner/renderer/src/pages/ProjectView.jsx` | Pass projectId to KanbanBoard for quick-add |
| `runner/renderer/src/App.jsx` | Route to Pipelines page |

---

## Task 1: Add brainstorm pipeline and agent templates to bootstrap

**Files:**
- Modify: `runner/main/bootstrap.js`
- Modify: `runner/main/test/bootstrap.test.js`

- [ ] **Step 1: Update bootstrap.test.js — add assertions for new templates**

Add to the existing "creates all required directories and default files" test:

```javascript
    // New brainstorm agents
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-researcher.json')));
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-brainstormer.json')));

    // Brainstorm pipeline
    a.ok(existsSync(join(paths.pipelineTemplatesDir, 'brainstorm.json')));
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test runner/main/test/bootstrap.test.js
```

Expected: FAIL — files don't exist.

- [ ] **Step 3: Add new agent templates and pipeline to bootstrap.js**

Add to `DEFAULT_AGENTS`:

```javascript
  'claude-researcher': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are a codebase researcher investigating: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nExplore the codebase thoroughly to understand the context for this idea. Read relevant files, check architecture, understand patterns.\n\nProduce a structured research summary covering:\n- Relevant existing code and patterns\n- Dependencies and constraints\n- Potential approaches\n- Risks or concerns\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done:\n```specd-result\n{"status":"success","summary":"...","files_changed":[],"issues":[]}\n```',
  },
  'claude-brainstormer': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are a design brainstormer working on: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nPrevious stage research:\n{{previous_stage_output}}\n\nBased on the research above, design a solution for this idea. Consider multiple approaches, pick the best one, and write a complete spec covering:\n- Architecture and components\n- Data flow\n- Key implementation details\n- Testing strategy\n\nWrite the spec as a clear, actionable document that an engineer can implement from.\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done, include the full spec in your summary:\n```specd-result\n{"status":"success","summary":"<full spec content>","files_changed":[],"issues":[]}\n```',
  },
```

Add after `DEFAULT_PIPELINE`:

```javascript
const BRAINSTORM_PIPELINE = {
  name: 'brainstorm',
  stages: [
    { stage: 'research', agent: 'claude-researcher', critical: true },
    { stage: 'brainstorm', agent: 'claude-brainstormer', critical: true },
  ],
};
```

Add to `bootstrap()` function after the default pipeline write:

```javascript
  writeIfMissing(join(paths.pipelineTemplatesDir, 'brainstorm.json'), BRAINSTORM_PIPELINE);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test runner/main/test/bootstrap.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/bootstrap.js runner/main/test/bootstrap.test.js
git commit -m "feat(runner): add brainstorm pipeline and researcher/brainstormer agents"
```

---

## Task 2: Extend StageSequencer to pass output between stages

**Files:**
- Modify: `runner/main/pipeline/sequencer.js`
- Modify: `runner/main/agent/template.js`

- [ ] **Step 1: Update sequencer to track and pass previous stage results**

Replace `runner/main/pipeline/sequencer.js`:

```javascript
// runner/main/pipeline/sequencer.js
export class StageSequencer {
  constructor({ stages, createRunner, onStageStart, onStageComplete }) {
    this.stages = stages;
    this.createRunner = createRunner;
    this.onStageStart = onStageStart;
    this.onStageComplete = onStageComplete;
  }

  async run() {
    const results = [];
    let previousOutput = '';

    for (const stage of this.stages) {
      const maxAttempts = 1 + (stage.max_retries || 0);
      let stageResult = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const runner = this.createRunner(stage, previousOutput);
        await this.onStageStart(stage, attempt);

        try {
          stageResult = await runner.run('');
        } catch (err) {
          stageResult = { status: 'failure', summary: err.message };
        }

        await this.onStageComplete(stage, stageResult, attempt);

        if (stageResult.status === 'success') break;
        if (stageResult.status === 'failure' && stage.on_fail !== 'retry') break;
      }

      results.push({ stage: stage.stage, ...stageResult });
      previousOutput = stageResult?.summary || '';

      if (stageResult.status !== 'success' && stage.critical) {
        return { status: 'failure', results, failedStage: stage.stage };
      }
    }

    return { status: 'success', results };
  }
}
```

- [ ] **Step 2: Add `previous_stage_output` to template context**

In `runner/main/agent/template.js`, update `buildTemplateContext`:

```javascript
export function buildTemplateContext(task, stage, pipeline, paths, previousOutput) {
  return {
    task: { id: task.id, name: task.name, spec: task.spec || '' },
    stage: { name: stage.stage, index: stage.index, total: stage.total },
    pipeline: { name: pipeline.name },
    status_file: paths?.statusJson || '',
    log_dir: paths?.logsDir || '',
    previous_stage_output: previousOutput || '',
  };
}
```

- [ ] **Step 3: Update orchestrator's createRunner to pass previousOutput**

In `runner/main/orchestrator.js`, change the `createRunner` callback signature from `(stage)` to `(stage, previousOutput)`:

```javascript
      createRunner: (stage, previousOutput) => {
        const agentDef = agents[stage.agent];
        if (!agentDef) throw new Error(`Agent not found: ${stage.agent}`);

        const context = buildTemplateContext(task, stage, pipeline, this.projectPaths, previousOutput);
```

- [ ] **Step 4: Run existing tests**

```bash
node --test runner/main/test/*.test.js
```

Expected: All 24 tests PASS (sequencer has no tests, template has no tests — only agent-parser, bootstrap, db, paths, state-manager, template-manager).

- [ ] **Step 5: Commit**

```bash
git add runner/main/pipeline/sequencer.js runner/main/agent/template.js runner/main/orchestrator.js
git commit -m "feat(runner): pass previous stage output between pipeline stages"
```

---

## Task 3: Add advance-task and create-idea to orchestrator

**Files:**
- Modify: `runner/main/orchestrator.js`

- [ ] **Step 1: Add `createIdea` method to Orchestrator**

Add after the `updateTask` method:

```javascript
  createIdea(name) {
    const { randomUUID } = require('crypto');
    const task = {
      id: `idea-${randomUUID().slice(0, 6)}`,
      name,
      description: '',
      project_id: this.projectId,
      working_dir: '.',
      pipeline: null,
      status: 'idea',
      priority: 10,
      depends_on: [],
      spec: '',
      feedback: '',
      created_at: new Date().toISOString(),
    };
    return this.createTask(task);
  }
```

Wait — we use ESM. Fix the import:

```javascript
  createIdea(name) {
    const id = `idea-${Date.now().toString(36)}`;
    const task = {
      id,
      name,
      description: '',
      project_id: this.projectId,
      working_dir: '.',
      pipeline: null,
      status: 'idea',
      priority: 10,
      depends_on: [],
      spec: '',
      feedback: '',
      created_at: new Date().toISOString(),
    };
    return this.createTask(task);
  }
```

- [ ] **Step 2: Add `advanceTask` method to Orchestrator**

Add after `createIdea`:

```javascript
  async advanceTask(taskId, action, feedback) {
    const task = this.getTask(taskId);
    if (!task) return null;

    if (action === 'plan') {
      // idea → planning: trigger brainstorm pipeline
      if (feedback) {
        this.updateTask(taskId, { status: 'planning', feedback });
      } else {
        this.updateTask(taskId, { status: 'planning' });
      }

      // Run brainstorm pipeline async
      this._runBrainstormPipeline(task).catch(err => {
        console.error(`Brainstorm failed for ${taskId}:`, err);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });

      return this.getTask(taskId);
    }

    if (action === 'approve') {
      // review → ready
      this.updateTask(taskId, { status: 'ready' });
      return this.getTask(taskId);
    }

    if (action === 're-plan') {
      // review → planning with feedback
      const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
      this.updateTask(taskId, { status: 'planning', feedback: updatedFeedback });

      this._runBrainstormPipeline({ ...task, feedback: updatedFeedback }).catch(err => {
        console.error(`Re-plan failed for ${taskId}:`, err);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });

      return this.getTask(taskId);
    }

    if (action === 'retry') {
      // failed → idea (if brainstorm failed) or ready (if execution failed)
      const newStatus = task.failed_pipeline === 'brainstorm' ? 'idea' : 'ready';
      this.updateTask(taskId, { status: newStatus, failed_pipeline: null });
      return this.getTask(taskId);
    }

    return null;
  }
```

- [ ] **Step 3: Add `_runBrainstormPipeline` private method**

Add after `advanceTask`:

```javascript
  async _runBrainstormPipeline(task) {
    const agents = this.templateManager.getAgents(this.projectId);
    const pipelines = this.templateManager.getPipelines(this.projectId);
    const pipeline = resolvePipeline('brainstorm', pipelines, null, this.config.defaults);

    this.stateManager.registerTask(task.id, { name: task.name, pipeline: 'brainstorm' });
    this.stateManager.updateTaskStatus(task.id, 'planning');

    const prompt = [task.name, task.description, task.feedback].filter(Boolean).join('\n\n');
    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      createRunner: (stage, previousOutput) => {
        const agentDef = agents[stage.agent];
        if (!agentDef) throw new Error(`Agent not found: ${stage.agent}`);

        const context = buildTemplateContext(task, stage, pipeline, this.projectPaths, previousOutput);
        const resolvedPrompt = resolveTemplate(agentDef.system_prompt || '', context);

        const runner = new AgentRunner({
          ...agentDef,
          system_prompt: resolvedPrompt,
          timeout: stage.timeout,
          stuck_timeout: this.config.defaults?.stuck_timeout,
        });

        runner.on('status', (s) => this.stateManager.updateLiveProgress(task.id, s));
        runner.on('output', () => this.stateManager.persist());

        return { run: () => runner.run(prompt, { cwd: this.projectPath, logPath }) };
      },
      onStageStart: async (stage, attempt) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result, attempt) => {
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();
      },
    });

    const result = await sequencer.run();

    if (result.status === 'success') {
      // Extract spec from last stage's summary
      const lastStage = result.results[result.results.length - 1];
      this.updateTask(task.id, { status: 'review', spec: lastStage.summary || '' });
      this.stateManager.updateTaskStatus(task.id, 'review');
    } else {
      this.updateTask(task.id, { status: 'failed', failed_pipeline: 'brainstorm' });
      this.stateManager.updateTaskStatus(task.id, 'failed');
    }
    this.stateManager.persist();
  }
```

- [ ] **Step 4: Run tests**

```bash
node --test runner/main/test/*.test.js
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add runner/main/orchestrator.js
git commit -m "feat(runner): add advance-task lifecycle and brainstorm pipeline execution"
```

---

## Task 4: Add new IPC handlers and update preload

**Files:**
- Modify: `runner/main/ipc.js`
- Modify: `runner/preload.js`

- [ ] **Step 1: Add IPC handlers to ipc.js**

Add before the `get-config` handler:

```javascript
  ipcMain.handle('create-idea', (event, projectId, name) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.createIdea(name);
  });

  ipcMain.handle('advance-task', (event, projectId, taskId, action, feedback) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.advanceTask(taskId, action, feedback);
  });

  ipcMain.handle('get-pipeline-files', () => {
    const { paths } = getContext();
    return readTemplateDir(paths.pipelineTemplatesDir);
  });

  ipcMain.handle('get-agent-files', () => {
    const { paths } = getContext();
    return readTemplateDir(paths.agentTemplatesDir);
  });
```

Add helper function at top of `setupIpc` (after the function declaration):

```javascript
  function readTemplateDir(dir) {
    const { readdirSync } = require('fs');
```

Wait — ESM. Add the import at the top of the file:

```javascript
import { readFileSync, existsSync, readdirSync } from 'fs';
```

Update the existing `import { readFileSync, existsSync } from 'fs';` line. Then add inside `setupIpc`:

```javascript
  function readTemplateDir(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f.replace('.json', ''),
        filename: f,
        content: JSON.parse(readFileSync(join(dir, f), 'utf-8')),
      }));
  }
```

- [ ] **Step 2: Update preload.js whitelist**

Replace the `ALLOWED_CHANNELS` set:

```javascript
const ALLOWED_CHANNELS = new Set([
  'get-projects', 'get-project-status', 'get-tasks',
  'get-task', 'create-task', 'retry-task', 'get-task-logs', 'get-config',
  'register-project', 'unregister-project',
  'create-idea', 'advance-task', 'get-pipeline-files', 'get-agent-files',
]);
```

- [ ] **Step 3: Commit**

```bash
git add runner/main/ipc.js runner/preload.js
git commit -m "feat(runner): add IPC handlers for ideas, task advancement, and pipeline viewer"
```

---

## Task 5: Update KanbanBoard to 7 columns with quick-add and actions

**Files:**
- Modify: `runner/renderer/src/components/KanbanBoard.jsx`

- [ ] **Step 1: Replace KanbanBoard.jsx**

```jsx
import { useState } from 'react';
import { colors, radius, shadows } from '../theme';
import TaskDetailOverlay from './TaskDetailOverlay';

const COLUMNS = [
  { key: 'idea', label: 'Ideas', color: '#868e96', statuses: ['idea'] },
  { key: 'planning', label: 'Planning', color: '#cc5de8', statuses: ['planning'] },
  { key: 'review', label: 'Review', color: '#fcc419', statuses: ['review'] },
  { key: 'ready', label: 'Queued', color: colors.warning, statuses: ['ready', 'queued'] },
  { key: 'in_progress', label: 'Running', color: colors.accent, statuses: ['in_progress'] },
  { key: 'done', label: 'Done', color: colors.success, statuses: ['done'] },
  { key: 'failed', label: 'Failed', color: colors.danger, statuses: ['failed'] },
];

const ACTION_MAP = {
  idea: { label: 'Plan', action: 'plan' },
  review: { label: 'Approve', action: 'approve' },
  failed: { label: 'Retry', action: 'retry' },
};

export default function KanbanBoard({ tasks, projectId, projects, onRefresh }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [ideaText, setIdeaText] = useState('');
  const [ideaProject, setIdeaProject] = useState(projectId || projects?.[0]?.id || '');

  const handleAddIdea = async () => {
    const text = ideaText.trim();
    if (!text) return;
    const pid = projectId || ideaProject;
    if (!pid) return;
    await window.specd.invoke('create-idea', pid, text);
    setIdeaText('');
    if (onRefresh) onRefresh();
  };

  const handleAction = async (task, action, feedback) => {
    await window.specd.invoke('advance-task', task.projectId, task.id, action, feedback || '');
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(140px, 1fr))`,
        gap: 10,
        flex: 1,
        minHeight: 0,
        overflowX: 'auto',
      }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => col.statuses.includes(t.status));
          const isIdeasCol = col.key === 'idea';

          return (
            <div key={col.key} style={{
              backgroundColor: colors.surfaceHover,
              borderRadius: radius.md,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 200,
              overflow: 'auto',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${col.color}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: colors.text }}>{col.label}</span>
                <span style={{
                  backgroundColor: col.color, color: '#fff', borderRadius: 10,
                  padding: '1px 7px', fontSize: 10, fontWeight: 600, minWidth: 18, textAlign: 'center',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {isIdeasCol && (
                <div style={{ marginBottom: 8 }}>
                  {!projectId && projects?.length > 1 && (
                    <select
                      value={ideaProject}
                      onChange={(e) => setIdeaProject(e.target.value)}
                      style={{
                        width: '100%', padding: '5px 8px', marginBottom: 4,
                        backgroundColor: colors.surface, color: colors.text,
                        border: `1px solid ${colors.border}`, borderRadius: radius.sm,
                        fontSize: 11, outline: 'none',
                      }}
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddIdea(); }}
                    placeholder="Add an idea..."
                    style={{
                      width: '100%', padding: '6px 8px',
                      backgroundColor: colors.surface, color: colors.text,
                      border: `1px solid ${colors.border}`, borderRadius: radius.sm,
                      fontSize: 12, outline: 'none',
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    action={ACTION_MAP[t.status]}
                    onClick={() => setSelectedTask(t)}
                    onAction={(action) => handleAction(t, action)}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', padding: 20 }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailOverlay
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAdvance={(action, feedback) => {
            handleAction(selectedTask, action, feedback).then(() => setSelectedTask(null));
          }}
        />
      )}
    </>
  );
}

function TaskCard({ task, action, onClick, onAction }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        padding: '8px 10px',
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadows.md; e.currentTarget.style.borderColor = colors.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = shadows.sm; e.currentTarget.style.borderColor = colors.border; }}
    >
      <div style={{ fontWeight: 500, fontSize: 12, color: colors.text, marginBottom: 4 }}>{task.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          backgroundColor: colors.bg, borderRadius: radius.sm,
          padding: '1px 5px', fontSize: 10, fontWeight: 500, color: colors.textSecondary,
        }}>
          {task.projectName}
        </span>
        {action && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction(action.action); }}
            style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 600,
              border: `1px solid ${colors.accent}`, borderRadius: radius.sm,
              backgroundColor: 'transparent', color: colors.accent, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accent; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.accent; }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add runner/renderer/src/components/KanbanBoard.jsx
git commit -m "feat(runner): 7-column kanban with quick-add and card actions"
```

---

## Task 6: Update TaskDetailOverlay with spec viewer and Approve/Re-plan

**Files:**
- Modify: `runner/renderer/src/components/TaskDetailOverlay.jsx`

- [ ] **Step 1: Add approve/re-plan UI to TaskDetailOverlay**

Add after the retry button section, before the stages section:

```jsx
          {currentStatus === 'review' && task.spec && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: colors.text }}>Spec</h4>
              <div style={{
                backgroundColor: '#111213', color: '#ced4da', padding: 14, borderRadius: radius.md,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: 12, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5,
              }}>
                {task.spec}
              </div>
            </div>
          )}

          {currentStatus === 'review' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => onAdvance?.('approve')}
                style={{
                  padding: '7px 16px', borderRadius: radius.md, border: 'none',
                  backgroundColor: colors.success, color: '#fff', cursor: 'pointer', fontSize: 13,
                }}
              >
                Approve
              </button>
              <button
                onClick={() => setShowReplan(true)}
                style={{
                  padding: '7px 16px', borderRadius: radius.md,
                  border: `1px solid ${colors.warning}`, backgroundColor: 'transparent',
                  color: colors.warning, cursor: 'pointer', fontSize: 13,
                }}
              >
                Re-plan
              </button>
            </div>
          )}

          {showReplan && (
            <div style={{ marginBottom: 20 }}>
              <textarea
                value={replanFeedback}
                onChange={(e) => setReplanFeedback(e.target.value)}
                placeholder="What should be changed in the plan?"
                style={{
                  width: '100%', height: 80, padding: 10, marginBottom: 8,
                  backgroundColor: colors.surface, color: colors.text,
                  border: `1px solid ${colors.border}`, borderRadius: radius.md,
                  fontSize: 13, resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => { onAdvance?.('re-plan', replanFeedback); setShowReplan(false); setReplanFeedback(''); }}
                style={{
                  padding: '7px 16px', borderRadius: radius.md, border: 'none',
                  backgroundColor: colors.warning, color: '#fff', cursor: 'pointer', fontSize: 13,
                }}
              >
                Send back for re-planning
              </button>
            </div>
          )}
```

Also add state variables at the top of the component:

```javascript
  const [showReplan, setShowReplan] = useState(false);
  const [replanFeedback, setReplanFeedback] = useState('');
```

And update the component signature to accept `onAdvance`:

```javascript
export default function TaskDetailOverlay({ task, onClose, onAdvance }) {
```

Update the retry button to use `onAdvance`:

```jsx
          {currentStatus === 'failed' && (
            <button onClick={() => onAdvance?.('retry')} style={{
```

- [ ] **Step 2: Commit**

```bash
git add runner/renderer/src/components/TaskDetailOverlay.jsx
git commit -m "feat(runner): add spec viewer and approve/re-plan to task detail overlay"
```

---

## Task 7: Update Dashboard and ProjectView to pass new props

**Files:**
- Modify: `runner/renderer/src/pages/Dashboard.jsx`
- Modify: `runner/renderer/src/pages/ProjectView.jsx`

- [ ] **Step 1: Update Dashboard.jsx**

Pass `projects` and `onRefresh` to KanbanBoard:

```jsx
      <KanbanBoard tasks={allTasks} projects={projects} onRefresh={loadAllTasks} />
```

- [ ] **Step 2: Update ProjectView.jsx**

Pass `projectId` and `onRefresh` to KanbanBoard:

```jsx
      <KanbanBoard tasks={tasks} projectId={projectId} onRefresh={loadTasks} />
```

- [ ] **Step 3: Commit**

```bash
git add runner/renderer/src/pages/Dashboard.jsx runner/renderer/src/pages/ProjectView.jsx
git commit -m "feat(runner): wire quick-add and refresh to kanban board"
```

---

## Task 8: Add Pipelines page and sidebar nav

**Files:**
- Create: `runner/renderer/src/pages/Pipelines.jsx`
- Modify: `runner/renderer/src/components/Sidebar.jsx`
- Modify: `runner/renderer/src/App.jsx`

- [ ] **Step 1: Create Pipelines.jsx**

```jsx
// runner/renderer/src/pages/Pipelines.jsx
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
```

- [ ] **Step 2: Add Pipelines nav item to Sidebar.jsx**

Add before the Settings button (before `<div style={{ marginTop: 'auto' ...`):

```jsx
      <div style={{ height: 1, backgroundColor: colors.sidebarHover, margin: '8px 0' }} />

      <button onClick={() => onSelect('pipelines')} style={navItem(selectedId === 'pipelines')}>
        Pipelines
      </button>
```

- [ ] **Step 3: Update App.jsx to route to Pipelines**

Add import:

```javascript
import Pipelines from './pages/Pipelines';
```

Add route after the settings conditional:

```jsx
        {selectedId === 'pipelines' && <Pipelines />}
```

Update the project view conditional to exclude 'pipelines':

```jsx
        {selectedId && selectedId !== 'settings' && selectedId !== 'pipelines' && (
```

- [ ] **Step 4: Commit**

```bash
git add runner/renderer/src/pages/Pipelines.jsx runner/renderer/src/components/Sidebar.jsx runner/renderer/src/App.jsx
git commit -m "feat(runner): add read-only pipeline and agent viewer page"
```

---

## Task 9: Update API server routes for new statuses

**Files:**
- Modify: `runner/main/server/api.js`

- [ ] **Step 1: Update the task creation endpoint to support `idea` status**

In the POST `/projects/:id/tasks` handler, the `status` field already defaults to `req.body.status || 'ready'`, so creating ideas via API with `"status": "idea"` already works. No change needed.

- [ ] **Step 2: Add advance-task API endpoint**

Add after the retry endpoint:

```javascript
  // Advance task (plan, approve, re-plan, retry)
  router.post('/projects/:id/tasks/:taskId/advance', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const { action, feedback } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });

    const result = orch.advanceTask(req.params.taskId, action, feedback);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json(result);
  });
```

- [ ] **Step 3: Update the project list to include new status counts**

Update the task counts in the GET `/projects` handler to include the new statuses:

```javascript
        taskCounts: {
          total: tasks.length,
          idea: tasks.filter(t => t.status === 'idea').length,
          planning: tasks.filter(t => t.status === 'planning').length,
          review: tasks.filter(t => t.status === 'review').length,
          ready: tasks.filter(t => t.status === 'ready').length,
          running: tasks.filter(t => t.status === 'in_progress').length,
          done: tasks.filter(t => t.status === 'done').length,
          failed: tasks.filter(t => t.status === 'failed').length,
        },
```

- [ ] **Step 4: Commit**

```bash
git add runner/main/server/api.js
git commit -m "feat(runner): add advance-task API endpoint and new status counts"
```

---

## Task 10: Run all tests and verify

- [ ] **Step 1: Run all tests**

```bash
node --test runner/main/test/*.test.js
```

Expected: All PASS.

- [ ] **Step 2: Manual smoke test**

Start the app:
```bash
cd runner && npm run dev
```

In another terminal:
```bash
cd runner/renderer && npm run dev
```

Verify:
1. Dashboard shows 7 columns
2. Type an idea in the Ideas column input, press Enter → appears in Ideas
3. Click "Plan" button on idea card → moves to Planning
4. Click on Pipelines in sidebar → shows pipeline and agent JSON files
5. Task detail overlay shows spec content for review tasks

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "test: smoke test fixes for task lifecycle"
```

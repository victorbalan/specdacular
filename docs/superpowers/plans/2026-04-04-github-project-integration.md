# GitHub Project Integration Research — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create interactive HTML playground files that visualize the architectural differences between local state management and GitHub Projects V2 as a backing store for Specdacular's task runner.

**Architecture:** Five self-contained HTML files (no build tools, no npm, no external CDN) with embedded CSS/JS. SVG diagrams rendered inline. Dark theme with color coding: green=local, orange=GitHub, blue=interface. Each file openable via `file://` protocol.

**Tech Stack:** Pure HTML5, CSS3 (Grid/Flexbox/animations), vanilla JavaScript, inline SVG

**Design spec:** `docs/superpowers/specs/2026-04-04-github-project-integration-design.md`

---

## File Structure

All files go in `playground/github-integration/`:

| File | Responsibility |
|---|---|
| `index.html` | Landing page with project overview and links to all playgrounds |
| `comparison.html` | Side-by-side local vs GitHub architecture with field mapping table |
| `data-flow.html` | Animated step-by-step data flow for 5 task lifecycle scenarios |
| `architecture.html` | Three-tab explorer for Approach A/B/C with interactive SVG diagrams |
| `cli-commands.html` | Expandable reference mapping every local operation to `gh` CLI equivalent |

### Shared CSS conventions (duplicated per file — each file is self-contained):

```css
/* Color tokens */
--color-local: #4ade80;      /* green — local state */
--color-github: #fb923c;     /* orange — GitHub */
--color-interface: #60a5fa;  /* blue — interface layer */
--color-bg: #0f172a;         /* dark navy background */
--color-surface: #1e293b;    /* card/panel background */
--color-text: #e2e8f0;       /* primary text */
--color-muted: #94a3b8;      /* secondary text */
--color-border: #334155;     /* borders */

/* Typography */
font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
```

---

### Task 1: Create Landing Page (`index.html`)

**Files:**
- Create: `playground/github-integration/index.html`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p playground/github-integration
```

- [ ] **Step 2: Build the landing page**

Create `playground/github-integration/index.html` — a single-page overview with:

**Header section:**
- Title: "GitHub Project Integration Research"
- Subtitle: "Comparing local state management vs GitHub Projects V2 for Specdacular's task runner"
- Brief paragraph explaining this is a research deliverable (no production code)

**Card grid (2x2 layout):**
Each card links to one playground file and contains:
- Icon (inline SVG, simple geometric shape)
- Title (e.g., "Architecture Comparison")
- 2-line description of what the playground shows
- "Open →" link

The four cards:
1. **Architecture Comparison** → `comparison.html` — "Side-by-side view of local vs GitHub state management. Interactive field mapping table."
2. **Data Flow Scenarios** → `data-flow.html` — "Step-by-step animated data flows for 5 task lifecycle operations."
3. **Approach Explorer** → `architecture.html` — "Three-tab view comparing Full GitHub, Hybrid, and Pluggable Backend approaches."
4. **CLI Command Reference** → `cli-commands.html` — "Every local operation mapped to its `gh` CLI equivalent with expandable examples."

**Key findings section** (below cards):
A summary list of the 6 key research findings from the design spec:
1. Live progress is the critical gap
2. GitHub Projects V2 is API-mature enough
3. PR integration is already GitHub-native
4. Pluggable backend preserves optionality
5. Offline/latency trade-off is real
6. Spec storage needs a strategy

**Footer:**
- Link back to design spec path: `docs/superpowers/specs/2026-04-04-github-project-integration-design.md`

**Styling:**
- Dark theme using the shared CSS conventions above
- CSS Grid for card layout (2 columns, responsive to 1 column on narrow viewports)
- Hover effects on cards (subtle border glow)
- No JavaScript needed on this page

- [ ] **Step 3: Verify in browser**

```bash
open playground/github-integration/index.html
```

Verify: page renders, cards display, links point to correct files (they won't load yet — that's fine).

- [ ] **Step 4: Commit**

```bash
git add playground/github-integration/index.html
git commit -m "docs: add landing page for GitHub integration research playground"
```

---

### Task 2: Create Architecture Comparison (`comparison.html`)

**Files:**
- Create: `playground/github-integration/comparison.html`

- [ ] **Step 1: Build the comparison page**

Create `playground/github-integration/comparison.html` with three main sections:

**Section 1: Side-by-side architecture diagrams**

Two columns using CSS Grid:

**Left column — "Local State Architecture":**
An inline SVG diagram showing:
- Box: "Orchestrator" (center)
- Box: "StateManager" (connected below)
- Box: "tasks/*.json" (file icon, green border, connected to Orchestrator)
- Box: "status.json" (file icon, green border, connected to StateManager)
- Box: "AgentRunner" (connected right of Orchestrator)
- Box: "WorktreeManager" (connected below right)
- Box: "GitHub PRs" (orange border, connected to WorktreeManager)
- Arrows showing read/write directions
- All boxes use `--color-local` (green) borders except GitHub PR box

**Right column — "GitHub Projects Architecture":**
An inline SVG diagram showing:
- Box: "Orchestrator" (center)
- Box: "GitHub Sync Layer" (orange border, connected below)
- Box: "Project V2" (orange border, connected to Sync Layer)
- Box: "Issues" (orange border, connected to Sync Layer)
- Box: "AgentRunner" (connected right of Orchestrator)
- Box: "WorktreeManager" (connected below right)
- Box: "Pull Requests" (orange border, connected to both WorktreeManager and Issues)
- Arrows showing API calls with labels ("GraphQL", "REST")

SVG requirements:
- Use `<rect>`, `<text>`, `<line>` or `<path>` elements
- Rounded corners on boxes (`rx="8"`)
- Arrow markers defined in `<defs>`
- Viewbox sized to content (~600x400 per diagram)
- Responsive: `width="100%"` with preserved aspect ratio

**Section 2: Data field mapping table**

Interactive HTML table with these columns:
| Local Field | Type | GitHub Equivalent | Storage Location | Fidelity | Notes |

Rows from the spec's "Data Field Mapping (Complete)" section (18 rows). Each row color-coded:
- Green background: maps perfectly (10 fields)
- Yellow background: maps with workarounds (5 fields)
- Red background: no GitHub equivalent (3 fields)

JavaScript interactivity:
- Filter buttons at top: "All" | "Perfect Match" | "Workarounds" | "Gaps"
- Clicking a filter highlights matching rows and dims others
- Clicking a row expands a detail panel below it with the Notes text

**Section 3: Capability scorecard**

Two-column comparison grid:

| Capability | Local | GitHub |
|---|---|---|
| Read latency | ~0ms | 200-600ms |
| Write latency | ~0ms | 200-600ms |
| Offline support | Full | None |
| Live progress | Yes | No |
| Collaboration | No | Yes |
| Audit trail | No | Yes |
| Built-in UI | No | Yes (Kanban/Table/Roadmap) |
| PR integration | Manual | Native |
| Rate limits | None | 5000 pts/hr |
| Custom data | Unlimited | Limited fields |

Each row has colored indicators: green checkmark for strength, red X for weakness, yellow dash for partial.

**Navigation:**
- "← Back to Index" link at top
- Anchor links to jump between sections

- [ ] **Step 2: Verify in browser**

```bash
open playground/github-integration/comparison.html
```

Verify: both SVG diagrams render, table filters work, scorecard displays correctly. Test at different viewport widths.

- [ ] **Step 3: Commit**

```bash
git add playground/github-integration/comparison.html
git commit -m "docs: add architecture comparison playground with field mapping"
```

---

### Task 3: Create Data Flow Playground (`data-flow.html`)

**Files:**
- Create: `playground/github-integration/data-flow.html`

- [ ] **Step 1: Build the data flow page**

Create `playground/github-integration/data-flow.html` with an animated step-by-step visualization.

**Layout:**
- Scenario selector (horizontal tab bar) at top with 5 scenarios
- Main visualization area below
- Step counter and play/pause/next controls

**5 Scenarios (one tab each):**

**Scenario 1: "Create a Task"**

Local steps:
1. Orchestrator receives `createIdea(name, desc)` call
2. Generate task ID: `idea-${Date.now().toString(36)}`
3. Build task object (JSON)
4. `writeFileSync(tasksDir/${id}.json, JSON.stringify(task))`
5. Done — ~1ms total

GitHub steps:
1. Orchestrator receives `createIdea(name, desc)` call
2. `gh issue create --title name --body desc` → Issue #N created (~400ms)
3. `gh project item-add --owner @me --url issue-url` → item added to project (~300ms)
4. Look up Status field ID: `gh project field-list --format json` (~300ms)
5. Look up "Idea" option ID from field options
6. `gh project item-edit --field-id ... --single-select-option-id ...` → status set (~300ms)
7. Done — ~1300ms total, 4 API calls

**Scenario 2: "Update Task Status"**

Local steps:
1. `readFileSync(taskPath)` → task JSON
2. `task.status = 'in_progress'`
3. `writeFileSync(taskPath, JSON.stringify(task))`
4. `stateManager.updateTaskStatus(taskId, 'in_progress')`
5. Done — ~1ms total

GitHub steps:
1. Look up project item ID for this task (if not cached) (~300ms)
2. Look up Status field ID (if not cached) (~300ms)
3. Look up "In Progress" option ID (~0ms if cached with field)
4. `updateProjectV2ItemFieldValue` mutation (~300ms)
5. Done — ~300-900ms, 1-3 API calls

**Scenario 3: "Live Progress Update"**

Local steps:
1. Agent emits `specd-status` block
2. Parser fires `status` event
3. `stateManager.updateLiveProgress(taskId, progress)` — in-memory update
4. StateManager emits `change` event
5. WebSocket broadcasts to UI
6. Done — ~0ms, happens every 2-5 seconds

GitHub steps:
1. NOT FEASIBLE — API rate limits prevent updates every 2-5 seconds
2. Would require ~720-1800 API calls per hour per task
3. GitHub rate limit: 5000 points/hour total

(Show this as a red "X" with explanation)

**Scenario 4: "Resume from Checkpoint"**

Local steps:
1. On init, read `status.json`
2. `stateManager.getCompletedStages(taskId)` → array of completed stages
3. Pass to `StageSequencer` as `completedStages`
4. Sequencer skips completed stages, uses summaries as context
5. Done — ~1ms

GitHub steps:
1. Find issue for this task (`gh issue list --search "task-id"`) (~400ms)
2. Read issue comments to find stages JSON block (~300ms)
3. Parse JSON from comment body
4. Pass parsed stages to StageSequencer
5. Done — ~700ms, 2 API calls

**Scenario 5: "Stage Completion + PR"**

Local steps:
1. `stateManager.completeStage(taskId, 'success', summary)` — update in-memory
2. `stateManager.persist()` — write status.json
3. `worktreeManager.hasChanges(taskId)` — check git diff
4. `worktreeManager.push(taskId)` — git push
5. `worktreeManager.createDraftPR(taskId, name, summary)` — gh pr create
6. `updateTask(taskId, { pr_url })` — write task JSON
7. Done — mixed latency (local + git + GitHub)

GitHub steps:
1. Update issue comment with completed stages JSON (~300ms)
2. Update project item Status field (~300ms)
3. `git push` — same as local
4. `gh pr create --body "Fixes #N"` — same but with issue link
5. PR auto-links to issue (native)
6. Done — similar total time, but PR linking is better

**Visualization for each scenario:**

Show two parallel vertical timelines (Local | GitHub) side by side:
- Each step is a horizontal bar whose width represents relative time
- Steps animate in sequence (CSS keyframe animation)
- Color: green bars for local, orange bars for GitHub
- Step number and label shown on each bar
- Total time shown at bottom
- API call count badge

**Controls:**
- Tab bar to switch scenarios
- "Play" button to run animation
- "Step" button to advance one step at a time
- "Reset" button to restart
- Speed slider (0.5x — 2x)

**JavaScript implementation:**
- Each scenario is a data structure: `{ name, localSteps: [{label, duration, detail}], githubSteps: [...] }`
- Animation uses `requestAnimationFrame` or CSS `animation-delay` chains
- Switching tabs resets the animation state
- Step mode uses a counter to show/hide steps incrementally

- [ ] **Step 2: Verify in browser**

```bash
open playground/github-integration/data-flow.html
```

Verify: all 5 scenario tabs work, animation plays correctly, step-by-step mode works, speed control functions. Test the "Live Progress" scenario shows the red gap indicator.

- [ ] **Step 3: Commit**

```bash
git add playground/github-integration/data-flow.html
git commit -m "docs: add animated data flow playground with 5 lifecycle scenarios"
```

---

### Task 4: Create Approach Explorer (`architecture.html`)

**Files:**
- Create: `playground/github-integration/architecture.html`

- [ ] **Step 1: Build the approach explorer page**

Create `playground/github-integration/architecture.html` with a three-tab layout.

**Tab bar:**
Three tabs styled as pill buttons:
- "A: Full GitHub" (orange accent)
- "B: Hybrid" (yellow accent)
- "C: Pluggable Backend" (blue accent)

Active tab has filled background; inactive tabs have outline only.

**Each tab contains:**

1. **Architecture diagram** (inline SVG)
2. **How it works** (3-5 bullet points)
3. **Pros/Cons** (two-column list with green/red indicators)
4. **Code sketch** (syntax-highlighted code block showing the key abstraction)

**Tab A: Full GitHub**

SVG diagram (from design spec Approach A Mermaid):
- Orchestrator at center
- GitHub Sync Layer (orange) between Orchestrator and GitHub
- GitHub cloud containing: Project V2, Issues, Pull Requests
- AgentRunner and Claude Code Agent on the right
- WorktreeManager connecting to Pull Requests
- All data arrows go through GitHub Sync Layer to GitHub

How it works:
- All task state lives in GitHub Projects V2 + Issues
- Runner queries GitHub API for task list, status, specs
- Status updates go through GraphQL mutations
- Issue body stores spec, comments store stage results
- PRs auto-link to issues via "Fixes #N"

Code sketch:
```javascript
// All state operations go through GitHub API
async function createTask(name, description) {
  // 1. Create GitHub issue
  const issueUrl = execSync(
    `gh issue create --title "${name}" --body "${description}"`,
    { encoding: 'utf-8' }
  ).trim();

  // 2. Add to project
  execSync(`gh project item-add 1 --owner @me --url ${issueUrl}`);

  // 3. Set status to "Idea"
  // Requires: field ID lookup, option ID lookup, then mutation
  const fields = JSON.parse(
    execSync(`gh project field-list 1 --owner @me --format json`)
  );
  const statusField = fields.find(f => f.name === 'Status');
  const ideaOption = statusField.options.find(o => o.name === 'Idea');
  // ... updateProjectV2ItemFieldValue mutation
}
```

Pros: No local state, free Kanban UI, collaboration, audit trail, native PR linking
Cons: Loses live progress, 200-600ms latency, offline = dead, ID lookup complexity, rate limited

**Tab B: Hybrid**

SVG diagram (from design spec Approach B Mermaid):
- Orchestrator at center
- Local Cache (green, `status.json`) for live progress
- Sync Layer (yellow) connecting to GitHub at stage boundaries
- GitHub cloud with Project V2, Issues, PRs
- Bidirectional arrows between Sync Layer and GitHub labeled "stage boundaries"

How it works:
- Local `status.json` handles live progress (fast, no API calls)
- GitHub synced at stage boundaries (status change, stage complete)
- Reads from local cache first, GitHub as fallback
- Issue comments store completed stages JSON
- Best of both: local speed + GitHub persistence

Code sketch:
```javascript
class HybridStateManager {
  constructor(localPath, githubProject) {
    this.local = new LocalCache(localPath);     // Fast reads/writes
    this.github = new GitHubSync(githubProject); // Stage-boundary sync
  }

  updateLiveProgress(taskId, progress) {
    this.local.updateLiveProgress(taskId, progress); // Local only — fast
  }

  async completeStage(taskId, status, summary) {
    this.local.completeStage(taskId, status, summary);
    await this.github.syncStageCompletion(taskId, status, summary); // Sync to GitHub
  }

  async updateTaskStatus(taskId, newStatus) {
    this.local.updateTaskStatus(taskId, newStatus);
    await this.github.updateProjectItemStatus(taskId, newStatus); // Sync to GitHub
  }
}
```

Pros: Fast local reads, live progress works, offline-capable for in-progress work, GitHub UI available
Cons: Two sources of truth, sync conflict risk, more complexity

**Tab C: Pluggable Backend**

SVG diagram (from design spec Approach C Mermaid):
- Orchestrator at top
- TaskBackend Interface (blue) in the middle
- Two implementation boxes branching below: LocalBackend (green), GitHubBackend (orange)
- LocalBackend connects to tasks/*.json and status.json
- GitHubBackend connects to Project V2 and Issues
- Configuration arrow pointing to Interface layer

How it works:
- `TaskBackend` interface defines all state operations
- `LocalBackend` implements current file-based storage
- `GitHubBackend` implements GitHub Projects V2 + Issues storage
- Configured per project in `config.json`
- Orchestrator calls interface methods, doesn't know which backend

Code sketch:
```javascript
// The interface that both backends implement
class TaskBackend {
  async createTask(task) { throw new Error('not implemented'); }
  async getTask(taskId) { throw new Error('not implemented'); }
  async getTasks() { throw new Error('not implemented'); }
  async updateTask(taskId, updates) { throw new Error('not implemented'); }
  async deleteTask(taskId) { throw new Error('not implemented'); }
  updateLiveProgress(taskId, progress) { /* may be no-op */ }
  async getCompletedStages(taskId) { throw new Error('not implemented'); }
}

// Orchestrator doesn't care which backend
class Orchestrator {
  constructor({ backend }) {
    this.backend = backend; // LocalBackend or GitHubBackend
  }
  async createIdea(name, desc) {
    const task = { id: generateId(), name, description: desc, status: 'idea' };
    return this.backend.createTask(task);
  }
}

// Config-driven selection
const backend = config.backend === 'github'
  ? new GitHubBackend(config.github)
  : new LocalBackend(config.paths);
```

Pros: Maximum flexibility, clean separation, swap per project, future backends (Linear, Jira)
Cons: Abstraction cost, lowest common denominator, GitHub loses live progress, more code

**Interactive elements:**
- Clicking a tab switches content with a CSS transition (opacity fade)
- SVG diagrams have hover tooltips on each box explaining the component
- Pros/Cons lists use CSS counters for numbering

- [ ] **Step 2: Verify in browser**

```bash
open playground/github-integration/architecture.html
```

Verify: all three tabs switch correctly, SVG diagrams render, code blocks are readable, pros/cons display with correct indicators.

- [ ] **Step 3: Commit**

```bash
git add playground/github-integration/architecture.html
git commit -m "docs: add three-approach architecture explorer playground"
```

---

### Task 5: Create CLI Commands Reference (`cli-commands.html`)

**Files:**
- Create: `playground/github-integration/cli-commands.html`

- [ ] **Step 1: Build the CLI commands reference page**

Create `playground/github-integration/cli-commands.html` with an expandable operation reference.

**Layout:**
- Header with title and description
- Filter/search input at top
- Accordion-style operation list

**Operation rows (10 rows from the spec):**

Each row is a collapsible accordion item with:
- **Header** (always visible): Operation name | Local summary | GitHub summary | Fidelity badge
- **Expanded detail** (toggle on click): full code examples for both approaches

**Row 1: Create Task**
- Local: `writeFileSync(taskPath, JSON.stringify(task))`
- GitHub: `gh issue create` + `gh project item-add`
- Fidelity: Full
- Detail:
  ```javascript
  // LOCAL
  const task = { id: `idea-${Date.now().toString(36)}`, name, status: 'idea', ... };
  writeFileSync(join(tasksDir, `${task.id}.json`), JSON.stringify(task, null, 2));
  ```
  ```bash
  # GITHUB
  # Step 1: Create issue
  gh issue create --title "Feature name" --body "Description" --project "Specd Tasks"

  # Step 2: Set initial status (requires field/option ID lookup)
  gh project field-list 1 --owner @me --format json
  # Find Status field ID and "Idea" option ID from output
  gh project item-edit --id ITEM_ID --field-id STATUS_FIELD_ID \
    --project-id PROJECT_ID --single-select-option-id IDEA_OPTION_ID
  ```

**Row 2: Update Status**
- Local: `readFileSync` → modify → `writeFileSync`
- GitHub: `gh project item-edit --field-id ... --single-select-option-id ...`
- Fidelity: Full

**Row 3: Get All Tasks**
- Local: `readdirSync(tasksDir).map(f => JSON.parse(readFileSync(...)))`
- GitHub: `gh project item-list --format json`
- Fidelity: Full

**Row 4: Get Single Task**
- Local: `JSON.parse(readFileSync(join(tasksDir, id + '.json')))`
- GitHub: `gh issue view N --json title,body,labels,state`
- Fidelity: Full

**Row 5: Store Spec**
- Local: `task.spec = specText` in JSON file
- GitHub: `gh issue edit N --body "spec content"`
- Fidelity: Size-limited (~65K chars)

**Row 6: Store Feedback**
- Local: `task.feedback = text` in JSON file
- GitHub: `gh issue comment N --body "feedback text"`
- Fidelity: Better (threaded, timestamped)

**Row 7: Link PR**
- Local: `updateTask(id, { pr_url: url })`
- GitHub: Automatic — use `Fixes #N` in PR body
- Fidelity: Better (native)

**Row 8: Live Progress**
- Local: `stateManager.updateLiveProgress(taskId, { progress, percent })`
- GitHub: NOT FEASIBLE
- Fidelity: Lost (red badge)

**Row 9: Completed Stages (Checkpoint)**
- Local: `stateManager.getCompletedStages(taskId)` returns array
- GitHub: Parse JSON from issue comment code block
- Fidelity: Awkward

**Row 10: Delete Task**
- Local: `unlinkSync(join(tasksDir, id + '.json'))`
- GitHub: `gh issue close N --reason "not planned"` + `gh project item-archive`
- Fidelity: Full (different semantics — archive vs delete)

**Fidelity badges:**
- Green "Full" — direct mapping
- Green "Better" — GitHub is actually better
- Yellow "Partial" — works with workarounds
- Yellow "Awkward" — works but messy
- Red "Lost" — no GitHub equivalent

**JavaScript interactivity:**
- Click row header to expand/collapse detail section
- Search/filter input filters rows by operation name
- "Expand All" / "Collapse All" buttons
- Each detail section has two side-by-side code panels (Local | GitHub) with syntax highlighting via CSS classes (keywords, strings, comments colored differently — no external library)

**Simple syntax highlighting approach:**
```javascript
function highlight(code, lang) {
  // Replace keywords, strings, comments with <span class="kw/str/cmt">
  // JS keywords: const, let, function, return, async, await, import, ...
  // Bash keywords: #, gh, git, --flag
  // Strings: "..." or '...'
  // Comments: // or #
  return code
    .replace(/(\/\/.*$|#.*$)/gm, '<span class="cmt">$1</span>')
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="str">$1</span>')
    .replace(/\b(const|let|function|return|async|await|import|new|if)\b/g, '<span class="kw">$1</span>');
}
```

- [ ] **Step 2: Verify in browser**

```bash
open playground/github-integration/cli-commands.html
```

Verify: all 10 rows display, expand/collapse works, filter input filters rows, fidelity badges show correct colors, code blocks are readable with syntax highlighting.

- [ ] **Step 3: Commit**

```bash
git add playground/github-integration/cli-commands.html
git commit -m "docs: add CLI commands reference playground with expandable examples"
```

---

### Task 6: Final Verification and Index Update

**Files:**
- Verify: all 5 files in `playground/github-integration/`

- [ ] **Step 1: Verify all links work**

Open `index.html` and click each card link. Verify all 4 playground files load correctly.

```bash
open playground/github-integration/index.html
```

Check:
- `comparison.html` — SVG diagrams render, table filters work
- `data-flow.html` — all 5 scenarios animate, controls function
- `architecture.html` — all 3 tabs switch, code blocks readable
- `cli-commands.html` — all 10 rows expand, filter works

- [ ] **Step 2: Add back-navigation to all playground files**

Verify each playground file has a "← Back to Index" link at the top pointing to `index.html`.

- [ ] **Step 3: Final commit**

```bash
git add -A playground/github-integration/
git commit -m "docs: complete GitHub integration research playground suite

Five interactive HTML files comparing local state management vs
GitHub Projects V2 for task tracking. Includes architecture diagrams,
animated data flows, approach comparison, and CLI command reference."
```

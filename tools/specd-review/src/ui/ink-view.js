// src/ui/ink-view.js
//
// Interactive live view. A footer at the bottom lists a "★ summary" entry
// plus every agent; the region above shows ONE selected entry's content as a
// normal scrolling log (native terminal scroll and scrollback work). Up/Down
// arrows switch entries — switching reprints that entry's log.
//
// When the reviewers of a round finish, their findings are merged into the
// consolidated review summary, which becomes the "★ summary" entry. The
// findings gate's prompt lives in the footer, so the arrow keys keep working
// while you decide.
//
// A terminal scroll region (DECSTBM) keeps the footer fixed while output
// scrolls above it. No alternate screen. Exposes the same `ui` interface as
// plain-view.js. (Historically an Ink view; the export name is kept.)

import { stdin, stdout } from 'node:process';
import { parseGateInput, editFindingsInEditor } from './plain-view.js';
import { renderFindingsDoc, SEVERITY_ORDER } from '../findings.js';

const ESC = '\x1b';
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_MS = 250;
const MAX_BUFFER = 4000;
const SUMMARY = 'summary';

const dim = (s) => `${ESC}[2m${s}${ESC}[0m`;
const cyan = (s) => `${ESC}[36m${s}${ESC}[0m`;
const bold = (s) => `${ESC}[1m${s}${ESC}[0m`;

// Pure: derives the display icon + text for one agent row. Pinned by tests.
export function agentLineState({ name, status, done, findingCount = 0, skipped = false }) {
  if (skipped) return { name, icon: 'cross', text: 'skipped (no valid output)' };
  if (done) return { name, icon: 'check', text: `done — ${findingCount} finding(s)` };
  return { name, icon: 'spinner', text: status?.progress || 'starting…' };
}

function fmtElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// One-line severity breakdown for the summary footer row.
function summaryLine(findings) {
  if (!findings.length) return 'no findings';
  const parts = SEVERITY_ORDER
    .map((s) => { const n = findings.filter((f) => f.severity === s).length; return n ? `${n} ${s}` : null; })
    .filter(Boolean);
  return `${findings.length} findings · ${parts.join(' · ')}`;
}

// Strips control sequences and forces a string to exactly `w` columns.
function fit(str, w) {
  let s = String(str ?? '')
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\t/g, ' ')
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
  if (s.length > w) return s.slice(0, w);
  return s + ' '.repeat(w - s.length);
}

// Strips control sequences from a log line without changing its length.
function cleanLine(line) {
  return String(line ?? '')
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
}

export function createInkView() {
  let started = false;
  let footerH = 0;
  let footerTop = 1; // first screen row of the footer (1-based)
  let timer = null;
  let onResize = null;
  let frame = 0;

  const state = {
    round: 0,
    maxRounds: 0,
    baseLabel: '',
    startedAt: Date.now(),
    agents: [], // entry 0 is always the summary; rest are real agents
    selected: 0,
    mode: 'running', // 'running' | 'gate'
    gateValue: '',
    gateFindings: [],
    gateSummaries: {},
    onGateSubmit: null,
  };

  const rows = () => stdout.rows || 24;
  const cols = () => stdout.columns || 80;
  const regionBottom = () => footerTop - 1;
  const findAgent = (name) => state.agents.find((a) => a.name === name);
  const summaryEntry = () => state.agents.find((a) => a.role === SUMMARY);

  // ---- footer --------------------------------------------------------------

  function footerLines() {
    const w = cols() - 1; // stop short of the last column to avoid auto-wrap
    const sep = fit('── agents ', w).replace(/ +$/, (m) => '─'.repeat(m.length));
    const lines = [dim(sep)];
    state.agents.forEach((agent, i) => {
      const marker = i === state.selected ? '▸' : ' ';
      let row;
      if (agent.role === SUMMARY) {
        row = fit(`${marker} ★ ${'review summary'.padEnd(22)} ${agent.summaryText}`, w);
      } else {
        const ls = agentLineState(agent);
        const icon = ls.icon === 'spinner'
          ? SPINNER[frame % SPINNER.length]
          : (ls.icon === 'check' ? '✔' : '✖');
        row = fit(`${marker} ${icon} ${agent.name.padEnd(22).slice(0, 22)} ${ls.text}`, w);
      }
      lines.push(i === state.selected ? bold(row) : row);
    });
    while (lines.length < footerH - 1) lines.push('');

    if (state.mode === 'gate') {
      lines.push(cyan(fit(
        ` › ${state.gateValue}█   [enter] continue · /edit · /accept · /quit · or type feedback`,
        w,
      )));
    } else {
      const runningCount = state.agents.filter((a) => a.role !== SUMMARY && !a.done).length;
      const roundLabel = state.maxRounds ? `${state.round}/${state.maxRounds}` : `${state.round}`;
      lines.push(cyan(fit(
        ` round ${roundLabel} · ${state.baseLabel} · ${fmtElapsed(Date.now() - state.startedAt)}`
        + ` · ${runningCount} running · ↑↓ switch`,
        w,
      )));
    }
    return lines.slice(0, footerH);
  }

  function drawFooter() {
    if (!started) return;
    const lines = footerLines();
    let out = `${ESC}7`; // save cursor
    for (let i = 0; i < footerH; i++) {
      out += `${ESC}[${footerTop + i};1H${ESC}[2K${lines[i] || ''}`;
    }
    out += `${ESC}8`; // restore cursor
    stdout.write(out);
  }

  // ---- output region -------------------------------------------------------

  // Clears the scrolling region and reprints the selected entry's whole log.
  function reprintSelected() {
    if (!started) return;
    let out = '';
    for (let r = 1; r <= regionBottom(); r++) out += `${ESC}[${r};1H${ESC}[2K`;
    out += `${ESC}[1;1H`;
    const agent = state.agents[state.selected];
    if (agent) out += agent.output.map((l) => `${l}\n`).join('');
    stdout.write(out);
  }

  // ---- screen setup --------------------------------------------------------

  function applyScrollRegion() {
    footerTop = Math.max(2, rows() - footerH + 1);
    stdout.write(`${ESC}[1;${regionBottom()}r`);  // scroll region above the footer
    stdout.write(`${ESC}[${regionBottom()};1H`);  // park cursor at its bottom
  }

  function start() {
    if (started) return;
    started = true;
    footerH = state.agents.length + 3; // separator + entries + fixer slot + footer line
    stdout.write(`${ESC}[2J${ESC}[H${ESC}[?25l`); // clear, hide cursor
    applyScrollRegion();
    drawFooter();
    timer = setInterval(() => { frame += 1; drawFooter(); }, FRAME_MS);
    onResize = () => { applyScrollRegion(); reprintSelected(); drawFooter(); };
    stdout.on('resize', onResize);
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onKey);
    process.once('exit', () => { if (started) stdout.write(`${ESC}[r${ESC}[?25h`); });
  }

  function stop() {
    if (!started) return;
    started = false;
    stdin.removeListener('data', onKey);
    if (stdin.isTTY) stdin.setRawMode(false);
    if (timer) { clearInterval(timer); timer = null; }
    if (onResize) { stdout.removeListener('resize', onResize); onResize = null; }
    stdout.write(`${ESC}[r`);                       // reset scroll region
    stdout.write(`${ESC}[?25h${ESC}[${rows()};1H\n`); // show cursor, move below footer
  }

  // ---- input ---------------------------------------------------------------

  function selectAgent(delta) {
    if (!state.agents.length) return;
    const next = Math.min(state.agents.length - 1, Math.max(0, state.selected + delta));
    if (next === state.selected) return;
    state.selected = next;
    reprintSelected();
    drawFooter();
  }

  function refreshSummary() {
    const s = summaryEntry();
    if (!s) return;
    s.output = renderFindingsDoc(state.gateFindings, state.gateSummaries).split('\n');
    s.summaryText = summaryLine(state.gateFindings);
  }

  function submitGate() {
    const parsed = parseGateInput(state.gateValue);
    if (parsed.action === 'edit') {
      stop(); // give $EDITOR a clean terminal
      try {
        state.gateFindings = editFindingsInEditor(state.gateFindings);
      } catch {
        // editor aborted/failed — keep findings unchanged
      }
      state.gateValue = '';
      start();
      refreshSummary();
      reprintSelected();
      drawFooter();
      return;
    }
    const resolve = state.onGateSubmit;
    state.onGateSubmit = null;
    state.mode = 'running';
    state.gateValue = '';
    drawFooter();
    if (parsed.action === 'feedback') {
      resolve({ action: 'continue', findings: state.gateFindings, feedback: parsed.feedback });
    } else {
      resolve({ action: parsed.action, findings: state.gateFindings, feedback: '' });
    }
  }

  function onKey(data) {
    const s = data.toString();
    if (s === '\x03') { stop(); process.exit(130); }
    else if (s === `${ESC}[A`) selectAgent(-1);
    else if (s === `${ESC}[B`) selectAgent(1);
    else if (state.mode === 'gate') {
      if (s === '\r' || s === '\n') submitGate();
      else if (s === '\x7f' || s === '\x08') { state.gateValue = state.gateValue.slice(0, -1); drawFooter(); }
      else if (s >= ' ' && !s.startsWith(ESC)) { state.gateValue += s; drawFooter(); }
    } else if (s === 'q') {
      stop();
      process.exit(130);
    }
  }

  // ---- ui interface --------------------------------------------------------

  return {
    setHeader({ baseLabel, maxRounds } = {}) {
      if (baseLabel) state.baseLabel = baseLabel;
      if (maxRounds) state.maxRounds = maxRounds;
    },

    async showRound({ round, reviewers, base }) {
      state.round = round;
      if (!state.baseLabel) state.baseLabel = (base || '').slice(0, 7);
      const summary = {
        name: SUMMARY,
        role: SUMMARY,
        done: true,
        output: ['', '  The merged review summary appears here once the reviewers finish.', ''],
        summaryText: '(waiting for reviewers)',
      };
      const agents = reviewers.map((r) => ({
        name: r.name,
        role: 'reviewer',
        status: null,
        done: false,
        findingCount: 0,
        skipped: false,
        output: [],
      }));
      state.agents = [summary, ...agents];
      state.selected = agents.length ? 1 : 0; // default to the first reviewer
      state.mode = 'running';
      start();
      reprintSelected();
      drawFooter();
    },

    // Updates an agent row, adding it if unknown (e.g. the fixer mid-round).
    updateAgent(name, patch = {}) {
      let agent = findAgent(name);
      if (!agent) {
        agent = {
          name,
          role: patch.role || 'reviewer',
          status: null,
          done: false,
          findingCount: 0,
          skipped: false,
          output: [],
        };
        state.agents.push(agent);
      }
      Object.assign(agent, patch);
      drawFooter();
    },

    // Buffers a line for its agent; prints it live only if that agent is shown.
    appendOutput(name, line) {
      const agent = findAgent(name);
      if (!agent) return;
      const clean = cleanLine(line);
      agent.output.push(clean);
      if (agent.output.length > MAX_BUFFER) agent.output.shift();
      if (started && state.agents[state.selected] === agent) {
        stdout.write(`${clean}\n`);
      }
    },

    // Merges the round's findings into the summary entry, selects it, and
    // opens the gate prompt in the footer.
    async findingsGate({ findings, summaries }) {
      return new Promise((resolve) => {
        state.gateFindings = findings;
        state.gateSummaries = summaries || {};
        refreshSummary();
        const idx = state.agents.indexOf(summaryEntry());
        if (idx >= 0) state.selected = idx;
        state.mode = 'gate';
        state.gateValue = '';
        state.onGateSubmit = resolve;
        reprintSelected();
        drawFooter();
      });
    },

    async showResult({ outcome, reportPath }) {
      stop();
      stdout.write(`specd-review: ${outcome}\nreport: ${reportPath}\n`);
    },
  };
}

// src/ui/ink-view.js
//
// Interactive live view. The agent list is pinned in a footer at the bottom;
// the region above it shows ONE selected agent's output as a normal scrolling
// log (native terminal scroll and scrollback work). Up/Down arrows switch the
// selected agent — switching clears the region and reprints that agent's log.
//
// A terminal scroll region (DECSTBM) keeps the footer fixed while output
// scrolls above it. No alternate screen. Raw mode is used only to read the
// arrow keys. Exposes the same `ui` interface as plain-view.js. (Historically
// an Ink view; the export name is kept.)

import { stdin, stdout } from 'node:process';
import readline from 'node:readline';
import { formatFindings, parseGateInput, editFindingsInEditor } from './plain-view.js';

const ESC = '\x1b';
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_MS = 250;
const MAX_BUFFER = 3000;

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
  let keysOn = false;

  const state = {
    round: 0,
    maxRounds: 0,
    baseLabel: '',
    startedAt: Date.now(),
    agents: [], // { name, role, status, done, findingCount, skipped, output[] }
    selected: 0,
  };

  const rows = () => stdout.rows || 24;
  const cols = () => stdout.columns || 80;
  const regionBottom = () => footerTop - 1;
  const findAgent = (name) => state.agents.find((a) => a.name === name);

  // ---- footer --------------------------------------------------------------

  function footerLines() {
    const w = cols() - 1; // stop short of the last column to avoid auto-wrap
    const sep = fit('── agents ', w).replace(/ +$/, (m) => '─'.repeat(m.length));
    const lines = [dim(sep)];
    state.agents.forEach((agent, i) => {
      const ls = agentLineState(agent);
      const icon = ls.icon === 'spinner'
        ? SPINNER[frame % SPINNER.length]
        : (ls.icon === 'check' ? '✔' : '✖');
      const marker = i === state.selected ? '▸' : ' ';
      const row = fit(`${marker} ${icon} ${agent.name.padEnd(22).slice(0, 22)} ${ls.text}`, w);
      lines.push(i === state.selected ? bold(row) : row);
    });
    while (lines.length < footerH - 1) lines.push('');
    const runningCount = state.agents.filter((a) => !a.done).length;
    const roundLabel = state.maxRounds ? `${state.round}/${state.maxRounds}` : `${state.round}`;
    lines.push(cyan(fit(
      ` round ${roundLabel} · ${state.baseLabel} · ${fmtElapsed(Date.now() - state.startedAt)}`
      + ` · ${runningCount} running · ↑↓ switch agent`,
      w,
    )));
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

  // Clears the scrolling region and reprints the selected agent's whole log.
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

  function keysOnFn() {
    if (keysOn) return;
    keysOn = true;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onKey);
  }

  function keysOffFn() {
    if (!keysOn) return;
    keysOn = false;
    stdin.removeListener('data', onKey);
    if (stdin.isTTY) stdin.setRawMode(false);
  }

  function start() {
    if (started) return;
    started = true;
    footerH = state.agents.length + 3; // separator + reviewers + fixer slot + status
    stdout.write(`${ESC}[2J${ESC}[H`);
    applyScrollRegion();
    drawFooter();
    timer = setInterval(() => { frame += 1; drawFooter(); }, FRAME_MS);
    onResize = () => { applyScrollRegion(); reprintSelected(); drawFooter(); };
    stdout.on('resize', onResize);
    keysOnFn();
    process.once('exit', () => { if (started) stdout.write(`${ESC}[r`); });
  }

  function stop() {
    if (!started) return;
    started = false;
    keysOffFn();
    if (timer) { clearInterval(timer); timer = null; }
    if (onResize) { stdout.removeListener('resize', onResize); onResize = null; }
    stdout.write(`${ESC}[r`);              // reset scroll region
    stdout.write(`${ESC}[${rows()};1H\n`); // move below the footer
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

  function onKey(data) {
    const s = data.toString();
    if (s === '\x03' || s === 'q') { stop(); process.exit(130); }
    else if (s === `${ESC}[A`) selectAgent(-1);
    else if (s === `${ESC}[B`) selectAgent(1);
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
      state.agents = reviewers.map((r) => ({
        name: r.name,
        role: 'reviewer',
        status: null,
        done: false,
        findingCount: 0,
        skipped: false,
        output: [],
      }));
      state.selected = 0;
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

    async findingsGate({ findings }) {
      let current = findings;
      keysOffFn(); // hand stdin to readline for line editing
      const ask = () => new Promise((resolve) => {
        stdout.write(`\n${formatFindings(current)}\n`);
        const rl = readline.createInterface({ input: stdin, output: stdout });
        rl.question(
          '\n[enter]=continue  /edit  /accept  /quit  or type feedback > ',
          (answer) => { rl.close(); resolve(answer); },
        );
      });
      try {
        for (;;) {
          const parsed = parseGateInput(await ask());
          if (parsed.action === 'edit') {
            try {
              current = editFindingsInEditor(current);
            } catch {
              // editor aborted/failed — keep findings unchanged
            }
            applyScrollRegion();
            drawFooter();
            continue;
          }
          if (parsed.action === 'feedback') {
            return { action: 'continue', findings: current, feedback: parsed.feedback };
          }
          return { action: parsed.action, findings: current, feedback: '' };
        }
      } finally {
        if (started) keysOnFn();
      }
    },

    async showResult({ outcome, reportPath }) {
      stop();
      stdout.write(`specd-review: ${outcome}\nreport: ${reportPath}\n`);
    },
  };
}

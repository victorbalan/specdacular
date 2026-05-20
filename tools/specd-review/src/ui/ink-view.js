// src/ui/ink-view.js
//
// Interactive live view: agent output streams as a normal, infinite log at
// the top of the screen (native terminal scroll and scrollback work), and the
// agent list is pinned in a footer at the bottom.
//
// It works by setting a terminal scroll region (DECSTBM) covering everything
// above the footer: printed output scrolls within that region as usual, while
// the footer — drawn below the region with absolute cursor moves — stays put.
// No alternate screen, no raw mode. Exposes the same `ui` interface as
// plain-view.js. (Historically an Ink view; the export name is kept.)

import { stdin, stdout } from 'node:process';
import readline from 'node:readline';
import { formatFindings, parseGateInput, editFindingsInEditor } from './plain-view.js';

const ESC = '\x1b';
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_MS = 250;

const dim = (s) => `${ESC}[2m${s}${ESC}[0m`;
const cyan = (s) => `${ESC}[36m${s}${ESC}[0m`;

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
    agents: [],
  };

  const rows = () => stdout.rows || 24;
  const cols = () => stdout.columns || 80;

  function findAgent(name) {
    return state.agents.find((a) => a.name === name);
  }

  // ---- footer --------------------------------------------------------------

  function footerLines() {
    const w = cols() - 1; // stop short of the last column to avoid auto-wrap
    const lines = [dim(fit('── agents ', w).replace(/ +$/, (m) => '─'.repeat(m.length)))];
    for (const agent of state.agents) {
      const ls = agentLineState(agent);
      const icon = ls.icon === 'spinner'
        ? SPINNER[frame % SPINNER.length]
        : (ls.icon === 'check' ? '✔' : '✖');
      lines.push(fit(` ${icon} ${agent.name.padEnd(22).slice(0, 22)} ${ls.text}`, w));
    }
    while (lines.length < footerH - 1) lines.push('');
    const runningCount = state.agents.filter((a) => !a.done).length;
    const roundLabel = state.maxRounds ? `${state.round}/${state.maxRounds}` : `${state.round}`;
    lines.push(cyan(fit(
      ` round ${roundLabel} · ${state.baseLabel} · ${fmtElapsed(Date.now() - state.startedAt)}`
      + ` · ${runningCount} running`,
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

  // ---- screen setup --------------------------------------------------------

  function applyScrollRegion() {
    footerTop = Math.max(2, rows() - footerH + 1);
    // scroll region = everything above the footer
    stdout.write(`${ESC}[1;${footerTop - 1}r`);
    // park the cursor at the bottom of the scrolling region
    stdout.write(`${ESC}[${footerTop - 1};1H`);
  }

  function start() {
    if (started) return;
    started = true;
    // Footer = separator + one row per reviewer + a slot for the fixer + status.
    footerH = state.agents.length + 3;
    stdout.write(`${ESC}[2J${ESC}[H`); // clear the screen
    applyScrollRegion();
    drawFooter();
    timer = setInterval(() => { frame += 1; drawFooter(); }, FRAME_MS);
    onResize = () => { applyScrollRegion(); drawFooter(); };
    stdout.on('resize', onResize);
    process.once('exit', () => { if (started) stdout.write(`${ESC}[r`); });
  }

  function stop() {
    if (!started) return;
    started = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (onResize) { stdout.removeListener('resize', onResize); onResize = null; }
    stdout.write(`${ESC}[r`);              // reset scroll region to full screen
    stdout.write(`${ESC}[${rows()};1H\n`); // move below the footer
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
      }));
      start();
      if (round > 1) stdout.write(`\n${dim(`── round ${round} ──`)}\n`);
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
        };
        state.agents.push(agent);
      }
      Object.assign(agent, patch);
      drawFooter();
    },

    // Streams one output line into the scrolling log, tagged with its agent.
    appendOutput(name, line) {
      if (!started) return;
      const tag = name.padEnd(20).slice(0, 20);
      // Strip control sequences so a noisy agent cannot corrupt the layout.
      const clean = String(line ?? '')
        .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
      stdout.write(`${dim(tag)} │ ${clean}\n`);
    },

    async findingsGate({ findings }) {
      let current = findings;
      const ask = () => new Promise((resolve) => {
        stdout.write(`\n${formatFindings(current)}\n`);
        const rl = readline.createInterface({ input: stdin, output: stdout });
        rl.question(
          `\n[enter]=continue  /edit  /accept  /quit  or type feedback > `,
          (answer) => { rl.close(); resolve(answer); },
        );
      });
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
    },

    async showResult({ outcome, reportPath }) {
      stop();
      stdout.write(`specd-review: ${outcome}\nreport: ${reportPath}\n`);
    },
  };
}

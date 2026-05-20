// src/ui/ink-view.js
//
// Full-height Ink (React-for-terminal) TUI. Runs in the alternate screen
// buffer: a status bar, a selectable list of agents, and a scrollable pane
// showing the selected agent's live output. At the findings gate the pane
// shows the findings and the footer becomes an input box.
//
// Implements the same `ui` interface as plain-view.js. Build-free — no JSX;
// components are created with React.createElement.

import React from 'react';
import { render, Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { formatFindings, parseGateInput, editFindingsInEditor } from './plain-view.js';

const h = React.createElement;
const MAX_OUTPUT_LINES = 5000;
const SCROLL_STEP = 5;

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

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function Icon({ kind }) {
  if (kind === 'spinner') return h(Text, { color: 'cyan' }, h(Spinner, { type: 'dots' }));
  if (kind === 'check') return h(Text, { color: 'green' }, '✔');
  return h(Text, { color: 'red' }, '✖');
}

function AgentRow({ agent, selected }) {
  const ls = agentLineState(agent);
  const name = `${agent.name} `.padEnd(24).slice(0, 24);
  return h(
    Box,
    null,
    h(Text, { color: 'cyan' }, selected ? '▸ ' : '  '),
    h(Icon, { kind: ls.icon }),
    h(Text, { bold: selected }, ` ${name}`),
    h(Text, { dimColor: true, wrap: 'truncate' }, ls.text),
  );
}

// The whole screen. Pure render driven by `snap`; all state lives outside.
function App({ snap, onKey }) {
  useInput((input, key) => onKey(input, key));

  const { rows, cols, agents, selected, mode } = snap;
  const listRows = Math.max(1, agents.length);
  let outputRows = rows - 4 - listRows; // status, separator, pane label, footer
  if (outputRows < 3) outputRows = 3;

  const selectedAgent = agents[selected];
  const sourceLines = mode === 'gate'
    ? snap.findingsLines
    : (selectedAgent ? selectedAgent.output : []);
  const end = Math.max(0, sourceLines.length - snap.scroll);
  const start = Math.max(0, end - outputRows);
  const windowLines = sourceLines.slice(start, end);
  while (windowLines.length < outputRows) windowLines.push('');

  const running = agents.filter((a) => !a.done).length;
  const roundLabel = snap.maxRounds ? `${snap.round}/${snap.maxRounds}` : `${snap.round}`;
  const statusText = ` specd-review · round ${roundLabel} · ${snap.baseLabel} `
    + `· ${fmtElapsed(snap.now - snap.startedAt)} · ${running} running`;

  const paneLabel = mode === 'gate'
    ? ' findings — type feedback · /edit · /continue · /accept · /quit '
    : ` ${selectedAgent ? selectedAgent.name : '—'} · output `;

  const footer = mode === 'gate'
    ? h(Text, null, h(Text, { color: 'cyan' }, '> '), snap.gateValue, h(Text, { inverse: true }, ' '))
    : h(Text, { dimColor: true }, ' ↑↓ select agent · PgUp/PgDn scroll · q quit ');

  return h(
    Box,
    { flexDirection: 'column', width: cols, height: rows },
    h(Text, { backgroundColor: 'cyan', color: 'black', wrap: 'truncate' },
      (statusText + ' '.repeat(cols)).slice(0, cols)),
    h(Text, { dimColor: true }, '─'.repeat(cols)),
    ...agents.map((agent, i) => h(AgentRow, { key: agent.name, agent, selected: i === selected })),
    h(Text, { dimColor: true, wrap: 'truncate' },
      (`─ ${paneLabel} ` + '─'.repeat(cols)).slice(0, cols)),
    ...windowLines.map((line, i) => h(Text, { key: i, wrap: 'truncate' }, line || ' ')),
    footer,
  );
}

export function createInkView() {
  let instance = null;
  let timer = null;
  let onResize = null;

  const state = {
    round: 0,
    maxRounds: 0,
    base: '',
    baseLabel: '',
    startedAt: Date.now(),
    agents: [],
    selected: 0,
    scroll: 0,
    mode: 'running', // 'running' | 'gate'
    findingsLines: [],
    gateFindings: [],
    gateValue: '',
    onGateSubmit: null,
  };

  function snapshot() {
    return {
      ...state,
      now: Date.now(),
      rows: process.stdout.rows || 24,
      cols: process.stdout.columns || 80,
    };
  }

  function draw() {
    if (instance) instance.rerender(h(App, { snap: snapshot(), onKey }));
  }

  function enterAltScreen() {
    process.stdout.write('\x1b[?1049h\x1b[H');
  }
  function exitAltScreen() {
    process.stdout.write('\x1b[?1049l');
  }

  function ensureInstance() {
    if (instance) return;
    enterAltScreen();
    instance = render(h(App, { snap: snapshot(), onKey }));
    timer = setInterval(draw, 1000);
    onResize = () => draw();
    process.stdout.on('resize', onResize);
  }

  function teardown() {
    if (timer) { clearInterval(timer); timer = null; }
    if (onResize) { process.stdout.removeListener('resize', onResize); onResize = null; }
    if (instance) { instance.unmount(); instance = null; }
    exitAltScreen();
  }

  function findAgent(name) {
    return state.agents.find((a) => a.name === name);
  }

  function scrollPane(delta) {
    state.scroll = Math.max(0, state.scroll + delta);
  }

  function submitGate() {
    const parsed = parseGateInput(state.gateValue);
    if (parsed.action === 'edit') {
      // Suspend the TUI so $EDITOR gets a clean terminal, then resume.
      teardown();
      let edited = state.gateFindings;
      try {
        edited = editFindingsInEditor(state.gateFindings);
      } catch {
        // editor failed or was aborted — keep the findings as they were
      }
      state.gateFindings = edited;
      state.findingsLines = stripAnsi(formatFindings(edited)).split('\n');
      state.gateValue = '';
      state.scroll = 0;
      ensureInstance();
      draw();
      return;
    }
    const submit = state.onGateSubmit;
    state.onGateSubmit = null;
    state.mode = 'running';
    state.gateValue = '';
    if (parsed.action === 'feedback') {
      submit({ action: 'continue', findings: state.gateFindings, feedback: parsed.feedback });
    } else {
      submit({ action: parsed.action, findings: state.gateFindings, feedback: '' });
    }
  }

  function onKey(input, key) {
    if (key.upArrow) {
      if (state.mode === 'running') {
        state.selected = Math.max(0, state.selected - 1);
        state.scroll = 0;
      } else {
        scrollPane(1);
      }
    } else if (key.downArrow) {
      if (state.mode === 'running') {
        state.selected = Math.min(state.agents.length - 1, state.selected + 1);
        state.scroll = 0;
      } else {
        scrollPane(-1);
      }
    } else if (key.pageUp) {
      scrollPane(SCROLL_STEP);
    } else if (key.pageDown) {
      scrollPane(-SCROLL_STEP);
    } else if (state.mode === 'gate' && key.return) {
      submitGate();
      return;
    } else if (state.mode === 'gate' && (key.backspace || key.delete)) {
      state.gateValue = state.gateValue.slice(0, -1);
    } else if (state.mode === 'gate' && input && !key.ctrl && !key.meta) {
      state.gateValue += input;
    } else if (state.mode === 'running' && input === 'q') {
      teardown();
      process.exit(130);
    }
    draw();
  }

  return {
    setHeader({ baseLabel, maxRounds } = {}) {
      if (baseLabel) state.baseLabel = baseLabel;
      if (maxRounds) state.maxRounds = maxRounds;
    },

    async showRound({ round, reviewers, base }) {
      state.round = round;
      state.base = base;
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
      state.scroll = 0;
      state.mode = 'running';
      ensureInstance();
      draw();
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
      draw();
    },

    appendOutput(name, line) {
      let agent = findAgent(name);
      if (!agent) {
        this.updateAgent(name, {});
        agent = findAgent(name);
      }
      agent.output.push(line);
      if (agent.output.length > MAX_OUTPUT_LINES) agent.output.shift();
      draw();
    },

    async findingsGate({ findings }) {
      return new Promise((resolve) => {
        state.mode = 'gate';
        state.gateFindings = findings;
        state.findingsLines = stripAnsi(formatFindings(findings)).split('\n');
        state.gateValue = '';
        state.scroll = 0;
        state.onGateSubmit = resolve;
        ensureInstance();
        draw();
      });
    },

    async showResult({ outcome, reportPath }) {
      teardown();
      process.stdout.write(`\nspecd-review: ${outcome}\n`);
      process.stdout.write(`report: ${reportPath}\n`);
    },
  };
}

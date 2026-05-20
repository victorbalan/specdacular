// src/ui/ink-view.js
//
// Ink (React-for-terminal) TUI view. Implements the same `ui` interface as
// plain-view.js: a live panel with per-reviewer status lines (spinners) and a
// persistent input box at the findings gate.
//
// BUILD-FREE: no JSX. Components are built with React.createElement directly.
// `agentLineState` is the pinned, unit-tested pure function.

import React from 'react';
import { render, Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { formatFindings, parseGateInput, editFindingsInEditor } from './plain-view.js';

const h = React.createElement;

// ---------------------------------------------------------------------------
// Pinned, tested pure function — implemented EXACTLY per the plan.
// ---------------------------------------------------------------------------
export function agentLineState({ name, status, done, findingCount = 0, skipped = false }) {
  if (skipped) return { name, icon: 'cross', text: 'skipped (no valid output)' };
  if (done) return { name, icon: 'check', text: `done — ${findingCount} finding(s)` };
  return { name, icon: 'spinner', text: status?.progress || 'starting…' };
}

// ---------------------------------------------------------------------------
// Presentational components
// ---------------------------------------------------------------------------
function AgentIcon({ icon }) {
  if (icon === 'spinner') {
    return h(Text, { color: 'cyan' }, h(Spinner, { type: 'dots' }));
  }
  if (icon === 'check') return h(Text, { color: 'green' }, '✔');
  if (icon === 'cross') return h(Text, { color: 'red' }, '✖');
  return h(Text, null, ' ');
}

function AgentLine({ state }) {
  return h(
    Box,
    null,
    h(AgentIcon, { icon: state.icon }),
    h(Text, { bold: true }, ` ${state.name} `),
    h(Text, { dimColor: true }, state.text),
  );
}

function GateInput({ value }) {
  return h(
    Box,
    { marginTop: 1 },
    h(Text, { bold: true }, '[enter]=continue  /edit  /accept  /quit  or type feedback '),
    h(Text, { color: 'cyan' }, '> '),
    h(Text, null, value),
  );
}

function RoundView({ round, base, agentStates, findings, gateOpen, gateValue, onGate }) {
  useInput(
    (input, key) => {
      if (!gateOpen) return;
      if (key.return) {
        onGate('submit');
        return;
      }
      if (key.delete || key.backspace) {
        onGate('backspace');
        return;
      }
      if (key.ctrl || key.meta || key.escape || key.tab || key.upArrow
        || key.downArrow || key.leftArrow || key.rightArrow) {
        return;
      }
      if (input) onGate('char', input);
    },
    { isActive: gateOpen },
  );

  const children = [
    h(
      Text,
      { key: 'header', color: 'cyan', bold: true },
      `=== Round ${round} · base ${String(base).slice(0, 7)} ===`,
    ),
    h(
      Box,
      { key: 'agents', flexDirection: 'column', marginTop: 1 },
      ...agentStates.map((s) => h(AgentLine, { key: s.name, state: s })),
    ),
  ];

  if (gateOpen) {
    children.push(
      h(
        Box,
        { key: 'findings', flexDirection: 'column', marginTop: 1 },
        h(Text, null, formatFindings(findings)),
      ),
      h(GateInput, { key: 'gate', value: gateValue }),
    );
  }

  return h(Box, { flexDirection: 'column' }, ...children);
}

// ---------------------------------------------------------------------------
// The `ui` factory
// ---------------------------------------------------------------------------
export function createInkView() {
  // Mutable panel state, re-rendered on each change.
  let state = {
    round: 0,
    base: '',
    agentStates: [],
    findings: [],
    gateOpen: false,
    gateValue: '',
  };
  let instance = null; // ink render() handle
  // Gate input handler set up while the gate is open.
  let gateHandler = null;

  function draw() {
    const element = h(RoundView, {
      round: state.round,
      base: state.base,
      agentStates: state.agentStates,
      findings: state.findings,
      gateOpen: state.gateOpen,
      gateValue: state.gateValue,
      onGate: (kind, ch) => {
        if (gateHandler) gateHandler(kind, ch);
      },
    });
    if (!instance) {
      instance = render(element);
    } else {
      instance.rerender(element);
    }
  }

  return {
    async showRound({ round, reviewers, base }) {
      state = {
        round,
        base: base || '',
        agentStates: reviewers.map((r) =>
          agentLineState({ name: r.name, status: null, done: false })),
        findings: [],
        gateOpen: false,
        gateValue: '',
      };
      draw();
    },

    updateAgent(name, patch) {
      const next = agentLineState({ name, ...patch });
      state.agentStates = state.agentStates.map((s) => (s.name === name ? next : s));
      draw();
    },

    async findingsGate({ round, findings }) {
      let current = findings || [];

      // Open the gate input and resolve once the user picks an action.
      const collect = () => new Promise((resolve) => {
        let buffer = '';
        state.round = round;
        state.findings = current;
        state.gateOpen = true;
        state.gateValue = '';

        gateHandler = (kind, ch) => {
          if (kind === 'char') {
            buffer += ch;
            state.gateValue = buffer;
            draw();
            return;
          }
          if (kind === 'backspace') {
            buffer = buffer.slice(0, -1);
            state.gateValue = buffer;
            draw();
            return;
          }
          if (kind === 'submit') {
            gateHandler = null;
            const parsed = parseGateInput(buffer);
            resolve(parsed);
          }
        };
        draw();
      });

      // Loop so /edit can re-open the gate after editing findings.
      for (;;) {
        const parsed = await collect();
        if (parsed.action === 'edit') {
          // The editor needs the terminal; unmount ink so it can't fight
          // for raw-mode stdin, then redraw the gate afterwards.
          if (instance) {
            instance.unmount();
            instance = null;
          }
          current = editFindingsInEditor(current);
          continue;
        }
        // Close the gate panel before returning control.
        state.gateOpen = false;
        state.gateValue = '';
        draw();
        if (instance) {
          instance.unmount();
          instance = null;
        }
        if (parsed.action === 'feedback') {
          return { action: 'continue', findings: current, feedback: parsed.feedback };
        }
        return { action: parsed.action, findings: current, feedback: '' };
      }
    },

    // cli.js prints the final summary after ink unmounts — nothing to do here.
    async showResult() {},
  };
}

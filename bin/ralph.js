#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

// Parse args
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  ${bold}RALPH${reset} — Run All Loops Per Handoff

  State-machine loop that drives specd task lifecycle by spawning
  fresh Claude CLI instances per step.

  ${yellow}Usage:${reset}
    npx specdacular ralph [task-name]

  ${yellow}Options:${reset}
    ${cyan}--help, -h${reset}     Show this help
    ${cyan}--dry-run${reset}      Show what would be executed without running

  ${yellow}Prerequisites:${reset}
    1. Claude CLI installed and in PATH
    2. Run ${cyan}claude${reset} once to accept permissions
    3. A specd task exists (${cyan}/specd.new${reset})

  ${yellow}How it works:${reset}
    1. Reads task state from .specd/tasks/{name}/config.json
    2. Determines next step (discuss → research → plan → execute → review)
    3. Spawns ${cyan}claude -p${reset} with guardrails injected
    4. Waits for completion, re-reads state, loops

  ${yellow}Example:${reset}
    npx specdacular ralph my-feature
`);
  process.exit(0);
}

const dryRun = args.includes('--dry-run');
const taskNameArg = args.find(a => !a.startsWith('--'));

// Track current child for cleanup
let currentChild = null;
let shuttingDown = false;

// Graceful shutdown
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${yellow}Shutting down gracefully...${reset}`);
  if (currentChild) {
    try {
      // Kill the process group (detached child + its children)
      process.kill(-currentChild.pid, 'SIGTERM');
    } catch (e) {
      try {
        // Fallback: kill just the child
        currentChild.kill('SIGTERM');
      } catch {}
    }
  }
  // Give child a moment to clean up, then exit
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// --- Utility functions ---

function writeAtomic(filePath, data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n';
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, filePath);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function banner(title, subtitle) {
  console.log(`
${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}
 ${bold}RALPH: ${title}${reset}
${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}
${subtitle ? '\n ' + subtitle + '\n' : ''}`);
}

function stepBanner(stepName, phase, total) {
  const phaseInfo = phase && total ? `  Phase: ${phase}/${total}` : '';
  console.log(`
${dim}───────────────────────────────────────────────────────${reset}
 Step: ${cyan}${stepName}${reset}${phaseInfo}
${dim}───────────────────────────────────────────────────────${reset}
`);
}

function ask(question, options) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\n${yellow}${question}${reset}`);
    options.forEach((opt, i) => {
      console.log(`  ${cyan}${i + 1}${reset}) ${opt}`);
    });

    rl.question(`\n  Choice [1]: `, (answer) => {
      rl.close();
      const idx = parseInt(answer || '1', 10) - 1;
      resolve(options[Math.max(0, Math.min(idx, options.length - 1))]);
    });
  });
}

// --- Task resolution ---

function resolveTask() {
  // 1. From argument
  if (taskNameArg) return taskNameArg;

  // 2. From state.json
  const stateJson = readJson('.specd/state.json');
  if (stateJson && stateJson.current_task) return stateJson.current_task;

  // 3. From task directory scan
  try {
    const tasks = fs.readdirSync('.specd/tasks').filter(d =>
      fs.statSync(path.join('.specd/tasks', d)).isDirectory()
    );
    if (tasks.length === 1) return tasks[0];
    if (tasks.length > 1) {
      console.log(`${yellow}Multiple tasks found:${reset}`);
      tasks.forEach((t, i) => console.log(`  ${i + 1}) ${t}`));
      console.error(`${red}Specify task name: npx specdacular ralph <task-name>${reset}`);
      process.exit(1);
    }
  } catch {
    // No tasks dir
  }

  console.error(`${red}No tasks found. Create one with /specd.new${reset}`);
  process.exit(1);
}

// --- Pre-flight checks ---

function checkClaude() {
  try {
    execSync('which claude', { stdio: 'pipe' });
    return true;
  } catch {
    console.error(`${red}Claude CLI not found in PATH.${reset}`);
    console.error(`Install: ${cyan}npm install -g @anthropic-ai/claude-code${reset}`);
    return false;
  }
}

// --- Guardrails resolution ---

function findGuardrails() {
  const locations = [
    path.join(os.homedir(), '.claude', 'specdacular', 'guardrails', 'specd-rules.txt'),
    path.join(process.cwd(), 'specdacular', 'guardrails', 'specd-rules.txt'),
    path.join(process.cwd(), '.claude', 'specdacular', 'guardrails', 'specd-rules.txt'),
  ];
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  console.log(`${yellow}Warning: guardrails file not found. Continuing without.${reset}`);
  return null;
}

// --- Routing ---

function determineNextStep(taskName, config) {
  const taskDir = `.specd/tasks/${taskName}`;
  const stage = config.stage || 'discussion';
  const phases = config.phases || {};

  // Discussion stage
  if (stage === 'discussion') {
    // Check gray areas in CONTEXT.md
    try {
      const context = fs.readFileSync(path.join(taskDir, 'CONTEXT.md'), 'utf8');
      const grayAreas = (context.match(/- \[ \]/g) || []).length;
      if (grayAreas > 0) {
        return { step: 'discuss', workflow: 'discuss.md', pipeline: 'main' };
      }
    } catch {}
    return { step: 'research', workflow: 'research.md', pipeline: 'main' };
  }

  // Research stage
  if (stage === 'research') {
    const hasResearch = fs.existsSync(path.join(taskDir, 'RESEARCH.md'));
    if (!hasResearch) {
      return { step: 'research', workflow: 'research.md', pipeline: 'main' };
    }
    return { step: 'plan', workflow: 'plan.md', pipeline: 'main' };
  }

  // Planning stage
  if (stage === 'planning') {
    const hasPhases = fs.existsSync(path.join(taskDir, 'phases'));
    if (!hasPhases) {
      return { step: 'plan', workflow: 'plan.md', pipeline: 'main' };
    }
    // Fall through to execution logic
  }

  // Execution stage (or planning with phases)
  if (stage === 'execution' || stage === 'planning') {
    const current = phases.current || 1;
    const total = phases.total || 1;
    const status = phases.current_status || 'pending';
    const phaseNum = String(current).padStart(2, '0');
    const phaseDir = path.join(taskDir, 'phases', `phase-${phaseNum}`);

    if (status === 'pending') {
      const hasPlan = fs.existsSync(path.join(phaseDir, 'PLAN.md'));
      if (!hasPlan) {
        return { step: 'phase-plan', workflow: 'phase-plan.md', pipeline: 'phase-execution', phase: current, total };
      }
      return { step: 'execute', workflow: 'execute.md', pipeline: 'phase-execution', phase: current, total };
    }

    if (status === 'executing') {
      return { step: 'execute', workflow: 'execute.md', pipeline: 'phase-execution', phase: current, total, resume: true };
    }

    if (status === 'executed') {
      return { step: 'review', workflow: 'review.md', pipeline: 'phase-execution', phase: current, total };
    }

    if (status === 'completed') {
      // Check for decimal fix phases
      try {
        const entries = fs.readdirSync(path.join(taskDir, 'phases'));
        const fixPhases = entries.filter(e => e.startsWith(`phase-${phaseNum}.`)).sort();
        if (fixPhases.length > 0) {
          // Check if any fix phase needs execution
          return { step: 'execute', workflow: 'execute.md', pipeline: 'phase-execution', phase: current, total };
        }
      } catch {}

      if (current < total) {
        // Advance to next phase
        return { step: 'advance', phase: current + 1, total };
      }
      return { step: 'complete' };
    }
  }

  return { step: 'complete' };
}

// --- Claude spawning ---

function buildPrompt(taskName, stepName, workflowFile) {
  const specdPath = fs.existsSync(path.join(os.homedir(), '.claude', 'specdacular'))
    ? path.join(os.homedir(), '.claude', 'specdacular')
    : path.join(process.cwd(), 'specdacular');

  const workflowPath = path.join(specdPath, 'workflows', workflowFile);

  return `You are executing a specd workflow step autonomously.

Task: ${taskName}
Step: ${stepName}

Read and execute the workflow at: ${workflowPath}
The task argument is: ${taskName}

Read the task state from .specd/tasks/${taskName}/ to understand context.
Execute all workflow steps. Update state files when done.
Proceed autonomously — do not ask the user questions. Make reasonable decisions.
When a workflow step says to use AskUserQuestion, instead make the most reasonable default choice and proceed.`;
}

function formatToolLog(toolName, toolInput) {
  const short = {
    Read: () => toolInput.file_path ? path.basename(toolInput.file_path) : '',
    Write: () => toolInput.file_path ? path.basename(toolInput.file_path) : '',
    Edit: () => toolInput.file_path ? path.basename(toolInput.file_path) : '',
    Glob: () => toolInput.pattern || '',
    Grep: () => toolInput.pattern ? `/${toolInput.pattern}/` : '',
    Bash: () => {
      const cmd = toolInput.command || '';
      return cmd.length > 60 ? cmd.substring(0, 57) + '...' : cmd;
    },
    Agent: () => toolInput.description || '',
  };
  const fmt = short[toolName];
  const detail = fmt ? fmt() : '';
  return detail ? `${toolName} ${dim}${detail}${reset}` : toolName;
}

function runClaudeStep(prompt, guardrailsFile) {
  return new Promise((resolve, reject) => {
    const cliArgs = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--no-session-persistence',
    ];
    if (guardrailsFile) {
      cliArgs.push('--append-system-prompt-file', guardrailsFile);
    }

    const child = spawn('claude', cliArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
      detached: true,
      cwd: process.cwd(),
    });

    currentChild = child;

    let lastResult = null;
    let stderr = '';
    let buffer = '';

    child.stdout.on('data', (d) => {
      buffer += d;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);

          // Track final result message for cost info
          if (event.type === 'result') {
            lastResult = event;
          }

          // Log tool use
          if (event.type === 'assistant' && event.message && event.message.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_use') {
                const log = formatToolLog(block.name, block.input || {});
                console.log(`  ${dim}▸${reset} ${log}`);
              }
            }
          }
        } catch {
          // Skip malformed lines
        }
      }
    });
    child.stderr.on('data', (d) => { stderr += d; });

    child.on('error', (err) => {
      currentChild = null;
      reject(err);
    });

    child.on('close', (code) => {
      currentChild = null;
      resolve({ exitCode: code, result: lastResult || {}, stderr: stderr.trim() });
    });
  });
}

// --- Main loop ---

async function main() {
  const taskName = resolveTask();
  const taskDir = `.specd/tasks/${taskName}`;

  // Validate task exists
  if (!fs.existsSync(taskDir)) {
    console.error(`${red}Task directory not found: ${taskDir}${reset}`);
    process.exit(1);
  }

  // Pre-flight
  if (!checkClaude()) process.exit(1);

  const guardrails = findGuardrails();

  banner(taskName, `Mode: ${dryRun ? 'dry-run' : 'auto'}`);

  let iteration = 0;
  const maxIterations = 50; // Safety limit

  while (iteration < maxIterations) {
    iteration++;

    // Read current state
    const config = readJson(path.join(taskDir, 'config.json'));
    if (!config) {
      console.error(`${red}Cannot read config.json for ${taskName}${reset}`);
      process.exit(1);
    }

    // Determine next step
    const route = determineNextStep(taskName, config);

    // Handle completion
    if (route.step === 'complete') {
      config.stage = 'complete';
      writeAtomic(path.join(taskDir, 'config.json'), config);
      console.log(`
${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}
 ${bold}TASK COMPLETE${reset}
${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}

 Task: ${taskName}
 Phases completed: ${config.phases ? config.phases.completed : '?'}
`);
      break;
    }

    // Handle phase advancement
    if (route.step === 'advance') {
      config.phases.current = route.phase;
      config.phases.current_status = 'pending';
      delete config.phases.phase_start_commit;
      writeAtomic(path.join(taskDir, 'config.json'), config);
      console.log(`${green}✓${reset} Advanced to phase ${route.phase}/${route.total}`);
      continue;
    }

    // Show step info
    stepBanner(route.step, route.phase, route.total);

    if (dryRun) {
      console.log(`  ${dim}Would execute: ${route.workflow}${reset}`);
      console.log(`  ${dim}Prompt: ${buildPrompt(taskName, route.step, route.workflow).substring(0, 100)}...${reset}`);

      const choice = await ask('Continue dry-run?', ['Next step', 'Stop']);
      if (choice === 'Stop') break;

      // Simulate state advancement for dry-run
      if (route.step === 'discuss') config.stage = 'research';
      else if (route.step === 'research') config.stage = 'planning';
      else if (route.step === 'plan') { config.stage = 'execution'; config.phases = { total: 1, current: 1, current_status: 'pending', completed: 0 }; }
      writeAtomic(path.join(taskDir, 'config.json'), config);
      continue;
    }

    // Build prompt and execute
    const prompt = buildPrompt(taskName, route.step, route.workflow);

    console.log(`  ${dim}Spawning claude -p ...${reset}`);
    try {
      const result = await runClaudeStep(prompt, guardrails);

      if (result.exitCode !== 0) {
        console.log(`\n${red}Step failed (exit code ${result.exitCode})${reset}`);
        if (result.stderr) {
          console.log(`${dim}${result.stderr}${reset}`);
        }

        const choice = await ask('What would you like to do?', ['Retry', 'Skip', 'Stop']);
        if (choice === 'Retry') continue;
        if (choice === 'Stop') {
          console.log(`\n${yellow}Progress saved. Resume with:${reset} npx specdacular ralph ${taskName}`);
          break;
        }
        // Skip — continue loop, state should be updated by the step
      } else {
        console.log(`${green}✓${reset} Step ${route.step} complete`);
        const cost = result.result && (result.result.total_cost_usd ?? result.result.costUsd);
        if (cost) {
          console.log(`  ${dim}Cost: $${Number(cost).toFixed(4)}${reset}`);
        }
      }
    } catch (err) {
      console.error(`${red}Error spawning claude: ${err.message}${reset}`);
      const choice = await ask('What would you like to do?', ['Retry', 'Stop']);
      if (choice === 'Stop') break;
    }
  }

  if (iteration >= maxIterations) {
    console.error(`${yellow}Safety limit reached (${maxIterations} iterations). Stopping.${reset}`);
  }
}

main().catch((err) => {
  console.error(`${red}Fatal error: ${err.message}${reset}`);
  process.exit(1);
});

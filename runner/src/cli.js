#!/usr/bin/env node
// runner/src/cli.js

const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .name('specd-runner')
  .description('Config-driven autonomous agent orchestrator')
  .version('0.1.0');

program
  .command('start')
  .description('Start the orchestrator daemon')
  .option('-p, --port <port>', 'Dashboard port', '3700')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const projectDir = path.resolve(opts.dir);
    const configDir = path.join(projectDir, '.specd', 'runner');
    console.log(`Starting orchestrator on port ${opts.port}...`);
    console.log(`Config dir: ${configDir}`);
    // Orchestrator wired in Task 14
  });

program
  .command('status')
  .description('Show current run status')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const projectDir = path.resolve(opts.dir);
    const statusPath = path.join(projectDir, '.specd', 'runner', 'status.json');
    // Status display wired in Task 14
    console.log(`Reading status from ${statusPath}`);
  });

program.parse();

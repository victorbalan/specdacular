#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../package.json');

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');
const hasHelp = args.includes('--help') || args.includes('-h');

const banner = '\n' +
  cyan + '  ███████╗██████╗ ███████╗ ██████╗\n' +
  '  ██╔════╝██╔══██╗██╔════╝██╔════╝\n' +
  '  ███████╗██████╔╝█████╗  ██║     \n' +
  '  ╚════██║██╔═══╝ ██╔══╝  ██║     \n' +
  '  ███████║██║     ███████╗╚██████╗\n' +
  '  ╚══════╝╚═╝     ╚══════╝ ╚═════╝' + reset + '\n' +
  '\n' +
  '  Specdacular ' + dim + 'v' + pkg.version + reset + '\n' +
  '  Feature planning for existing codebases.\n';

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx specdacular [options]\n
  ${yellow}Options:${reset}
    ${cyan}-g, --global${reset}      Install globally (to ~/.claude/)
    ${cyan}-l, --local${reset}       Install locally (to ./.claude/)
    ${cyan}-u, --uninstall${reset}   Uninstall specdacular
    ${cyan}-h, --help${reset}        Show this help message

  ${yellow}Examples:${reset}
    ${dim}# Interactive install${reset}
    npx specdacular

    ${dim}# Install globally${reset}
    npx specdacular --global

    ${dim}# Install to current project only${reset}
    npx specdacular --local

    ${dim}# Uninstall${reset}
    npx specdacular --global --uninstall
`);
  process.exit(0);
}

/**
 * Get the global config directory
 */
function getGlobalDir() {
  if (process.env.CLAUDE_CONFIG_DIR) {
    return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.claude');
}

/**
 * Expand ~ to home directory
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Read and parse settings.json
 */
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json with proper formatting
 */
function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

/**
 * Recursively copy directory with path replacement in .md files
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix);
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      // Replace path references
      content = content.replace(/~\/\.claude\//g, pathPrefix);
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}`);
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(`  ${yellow}✗${reset} Failed to install ${description}: empty`);
      return false;
    }
  } catch (e) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: ${e.message}`);
    return false;
  }
  return true;
}

/**
 * Uninstall specdacular
 */
function uninstall(isGlobal) {
  const targetDir = isGlobal ? getGlobalDir() : path.join(process.cwd(), '.claude');
  const locationLabel = isGlobal ? targetDir.replace(os.homedir(), '~') : './.claude';

  console.log(`  Uninstalling from ${cyan}${locationLabel}${reset}\n`);

  if (!fs.existsSync(targetDir)) {
    console.log(`  ${yellow}⚠${reset} Directory does not exist: ${locationLabel}`);
    return;
  }

  let removedCount = 0;

  // Remove specd commands
  const specCommandsDir = path.join(targetDir, 'commands', 'specd');
  if (fs.existsSync(specCommandsDir)) {
    fs.rmSync(specCommandsDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed commands/specd/`);
  }

  // Remove specdacular directory
  const specDir = path.join(targetDir, 'specdacular');
  if (fs.existsSync(specDir)) {
    fs.rmSync(specDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed specdacular/`);
  }

  // Remove specd agents
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir);
    let agentCount = 0;
    for (const file of files) {
      if (file.startsWith('specd-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentCount++;
      }
    }
    if (agentCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${agentCount} specd agents`);
    }
  }

  if (removedCount === 0) {
    console.log(`  ${yellow}⚠${reset} No specdacular files found to remove.`);
  } else {
    console.log(`\n  ${green}Done!${reset} Specdacular has been uninstalled.\n`);
  }
}

/**
 * Install specdacular
 */
function install(isGlobal) {
  const src = path.join(__dirname, '..');
  const targetDir = isGlobal ? getGlobalDir() : path.join(process.cwd(), '.claude');
  const locationLabel = isGlobal ? targetDir.replace(os.homedir(), '~') : './.claude';
  const pathPrefix = isGlobal ? `${targetDir}/` : './.claude/';

  console.log(`  Installing to ${cyan}${locationLabel}${reset}\n`);

  const failures = [];

  // Install commands
  const commandsDir = path.join(targetDir, 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  const specSrc = path.join(src, 'commands', 'specd');
  const specDest = path.join(commandsDir, 'specd');
  if (fs.existsSync(specSrc)) {
    copyWithPathReplacement(specSrc, specDest, pathPrefix);
    if (verifyInstalled(specDest, 'commands/specd')) {
      console.log(`  ${green}✓${reset} Installed commands/specd`);
    } else {
      failures.push('commands/specd');
    }
  }

  // Install specdacular core
  const coreSrc = path.join(src, 'specdacular');
  const coreDest = path.join(targetDir, 'specdacular');
  if (fs.existsSync(coreSrc)) {
    copyWithPathReplacement(coreSrc, coreDest, pathPrefix);
    if (verifyInstalled(coreDest, 'specdacular')) {
      console.log(`  ${green}✓${reset} Installed specdacular`);
    } else {
      failures.push('specdacular');
    }
  }

  // Install agents
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetDir, 'agents');
    fs.mkdirSync(agentsDest, { recursive: true });

    // Remove old specd agents
    if (fs.existsSync(agentsDest)) {
      for (const file of fs.readdirSync(agentsDest)) {
        if (file.startsWith('specd-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(agentsDest, file));
        }
      }
    }

    // Copy new agents
    const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
    for (const entry of agentEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
        content = content.replace(/~\/\.claude\//g, pathPrefix);
        fs.writeFileSync(path.join(agentsDest, entry.name), content);
      }
    }
    if (verifyInstalled(agentsDest, 'agents')) {
      console.log(`  ${green}✓${reset} Installed agents`);
    } else {
      failures.push('agents');
    }
  }

  // Write VERSION file
  const versionDest = path.join(targetDir, 'specdacular', 'VERSION');
  fs.mkdirSync(path.dirname(versionDest), { recursive: true });
  fs.writeFileSync(versionDest, pkg.version);
  console.log(`  ${green}✓${reset} Wrote VERSION (${pkg.version})`);

  if (failures.length > 0) {
    console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(', ')}`);
    process.exit(1);
  }

  console.log(`
  ${green}Done!${reset} Launch Claude Code and run ${cyan}/specd:help${reset}.

  ${yellow}Commands:${reset}
    /specd:map-codebase  - Analyze and document your codebase
    /specd:help          - Show all commands
`);
}

/**
 * Prompt for install location
 */
function promptLocation() {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal, defaulting to global install${reset}\n`);
    install(true);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  const globalPath = getGlobalDir().replace(os.homedir(), '~');

  console.log(`  ${yellow}Where would you like to install?${reset}

  ${cyan}1${reset}) Global ${dim}(${globalPath})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(./.claude)${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    const isGlobal = choice !== '2';
    install(isGlobal);
  });
}

// Main logic
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (hasUninstall) {
  if (!hasGlobal && !hasLocal) {
    console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
    process.exit(1);
  }
  uninstall(hasGlobal);
} else if (hasGlobal || hasLocal) {
  install(hasGlobal);
} else {
  promptLocation();
}

#!/usr/bin/env node

// bin/specd.js — unified CLI entry point
// Usage:
//   specd llm-init [--local]        — install commands/agents/workflows
//   specd install-runner             — download Specd Runner app from GitHub Releases
//   specd runner                     — launch Specd Runner app
//   specd runner register <path>     — register a folder
//   specd runner unregister <id>     — remove a project
//   specd runner projects            — list projects
//   specd runner status              — show task status

import { resolve, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, createWriteStream, unlinkSync } from 'fs';
import { homedir, platform, arch } from 'os';
import { execSync, spawn } from 'child_process';
import { get } from 'https';

const args = process.argv.slice(2);
const command = args[0];

function getAppDataDir() {
  if (platform() === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Specd');
  }
  return join(homedir(), '.config', 'specd');
}

function getAppInstallDir() {
  if (platform() === 'darwin') {
    return '/Applications';
  }
  return join(getAppDataDir(), 'app');
}

function getRunnerAppPath() {
  if (platform() === 'darwin') {
    return join(getAppInstallDir(), 'Specd Runner.app');
  }
  if (platform() === 'linux') {
    return join(getAppInstallDir(), 'Specd Runner.AppImage');
  }
  return join(getAppInstallDir(), 'Specd Runner.exe');
}

function isRunnerInstalled() {
  return existsSync(getRunnerAppPath());
}

function getDbPath() {
  return join(getAppDataDir(), 'db.json');
}

function loadDb() {
  const dbPath = getDbPath();
  if (!existsSync(dbPath)) return { projects: [] };
  return JSON.parse(readFileSync(dbPath, 'utf-8'));
}

function saveDb(data) {
  const dbPath = getDbPath();
  mkdirSync(join(dbPath, '..'), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { 'User-Agent': 'specd-cli' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve, reject);
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url) => {
      get(url, { headers: { 'User-Agent': 'specd-cli' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        }
        const total = parseInt(res.headers['content-length'], 10);
        let downloaded = 0;
        const file = createWriteStream(dest);
        res.on('data', (chunk) => {
          downloaded += chunk.length;
          if (total) {
            const pct = Math.round(downloaded / total * 100);
            process.stdout.write(`\rDownloading... ${pct}%`);
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('\rDownload complete.        ');
          resolve();
        });
      }).on('error', reject);
    };
    follow(url);
  });
}

async function installRunner() {
  const os = platform();
  const cpuArch = arch();

  console.log(`Fetching latest Specd Runner release...`);

  const release = await fetchJson(
    'https://api.github.com/repos/victorbalan/specdacular/releases/latest'
  ).catch(() => null);

  // Also check for runner-specific tags
  const releases = await fetchJson(
    'https://api.github.com/repos/victorbalan/specdacular/releases?per_page=10'
  ).catch(() => []);

  const runnerRelease = releases.find(r => r.tag_name?.startsWith('runner-v')) || release;

  if (!runnerRelease || !runnerRelease.assets?.length) {
    console.error('No runner release found. The Specd Runner app has not been published yet.');
    console.error('For local development, run from the repo: cd runner && npm install && npm run dev');
    process.exit(1);
  }

  // Find the right asset for this platform
  let assetName;
  if (os === 'darwin') {
    // Prefer dmg, fall back to zip
    const dmg = runnerRelease.assets.find(a => a.name.endsWith('.dmg') && (
      a.name.includes('arm64') ? cpuArch === 'arm64' : cpuArch === 'x64'
    ));
    const universalDmg = runnerRelease.assets.find(a => a.name.endsWith('.dmg') && a.name.includes('universal'));
    const anyDmg = runnerRelease.assets.find(a => a.name.endsWith('.dmg'));
    assetName = dmg || universalDmg || anyDmg;
  } else if (os === 'linux') {
    assetName = runnerRelease.assets.find(a => a.name.endsWith('.AppImage'));
  } else if (os === 'win32') {
    assetName = runnerRelease.assets.find(a => a.name.endsWith('.exe'));
  }

  if (!assetName) {
    console.error(`No runner build found for ${os}/${cpuArch}.`);
    console.error('Available assets:', runnerRelease.assets.map(a => a.name).join(', '));
    process.exit(1);
  }

  const tmpDir = join(getAppDataDir(), 'tmp');
  mkdirSync(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, assetName.name);

  console.log(`Downloading ${assetName.name} (${(assetName.size / 1024 / 1024).toFixed(1)} MB)...`);
  await download(assetName.browser_download_url, tmpFile);

  if (os === 'darwin') {
    if (assetName.name.endsWith('.dmg')) {
      console.log('Mounting DMG and copying app...');
      const mountOutput = execSync(`hdiutil attach "${tmpFile}" -nobrowse -quiet`, { encoding: 'utf-8' });
      const mountPoint = mountOutput.trim().split('\t').pop().trim();

      try {
        execSync(`cp -R "${mountPoint}/Specd Runner.app" "/Applications/"`, { stdio: 'pipe' });
      } finally {
        execSync(`hdiutil detach "${mountPoint}" -quiet`, { stdio: 'pipe' });
      }
    } else {
      // zip
      execSync(`unzip -o "${tmpFile}" -d "/Applications/"`, { stdio: 'pipe' });
    }
    console.log('Specd Runner installed to /Applications/Specd Runner.app');
  } else if (os === 'linux') {
    const installDir = getAppInstallDir();
    mkdirSync(installDir, { recursive: true });
    const dest = join(installDir, 'Specd Runner.AppImage');
    execSync(`cp "${tmpFile}" "${dest}" && chmod +x "${dest}"`);
    console.log(`Specd Runner installed to ${dest}`);
  } else {
    const installDir = getAppInstallDir();
    mkdirSync(installDir, { recursive: true });
    execSync(`cp "${tmpFile}" "${join(installDir, 'Specd Runner.exe')}"`);
    console.log(`Specd Runner installed to ${installDir}`);
  }

  // Cleanup
  try { unlinkSync(tmpFile); } catch {}

  console.log('Done! Run: specd runner');
}

if (command === 'llm-init') {
  const installScript = join(import.meta.dirname, 'install.js');
  const isLocal = args.includes('--local');
  process.argv = ['node', installScript, isLocal ? '--local' : '--global'];
  await import(installScript);

} else if (command === 'install-runner') {
  await installRunner();

} else if (command === 'runner') {
  const subcommand = args[1];

  if (subcommand === 'projects') {
    const db = loadDb();
    if (db.projects.length === 0) {
      console.log('No projects registered. Run: specd runner register <path>');
    } else {
      for (const p of db.projects) {
        console.log(`  ${p.id}  ${p.name}  ${p.path}  ${p.active ? '●' : '○'}`);
      }
    }
  } else if (subcommand === 'status') {
    try {
      const resp = await fetch('http://localhost:3700/api/status');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const status = await resp.json();
      for (const [projectId, state] of Object.entries(status)) {
        console.log(`\n${projectId}:`);
        for (const [taskId, task] of Object.entries(state.tasks || {})) {
          const icon = { done: '✓', in_progress: '▸', failed: '✗', queued: '○' }[task.status] || '?';
          console.log(`  ${icon} ${taskId}: ${task.name} [${task.status}]`);
        }
      }
    } catch {
      console.error('Runner not running. Start it with: specd runner');
    }
  } else {
    // No subcommand — launch the app
    if (!isRunnerInstalled()) {
      console.error('Specd Runner not installed. Run: specd install-runner');
      process.exit(1);
    }

    const appPath = getRunnerAppPath();
    if (platform() === 'darwin') {
      spawn('open', ['-a', appPath], { detached: true, stdio: 'ignore' }).unref();
    } else if (platform() === 'linux') {
      spawn(appPath, [], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn(appPath, [], { detached: true, stdio: 'ignore' }).unref();
    }
    console.log('Specd Runner launched.');
  }
} else {
  console.log('Usage:');
  console.log('  specd llm-init [--local]      Install Claude Code commands/agents');
  console.log('  specd install-runner           Download and install the Specd Runner app');
  console.log('  specd runner                   Launch the Specd Runner app');
  console.log('  specd runner projects          List registered projects');
  console.log('  specd runner status            Show task status');
}

// runner/main/index.js
import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { Paths } from './paths.js';
import { bootstrap } from './bootstrap.js';
import { ProjectDB } from './db.js';
import { Orchestrator } from './engine/orchestrator.js';
import { createServer } from './server/index.js';
import { setupIpc } from './ipc.js';
import { createLogger } from './logger.js';

let mainWindow;
const paths = new Paths();
const orchestrators = new Map();
let db;
let config;
let server;

function getContext() {
  return { db, config, paths, orchestrators };
}

async function initBackend() {
  await bootstrap(paths);

  db = new ProjectDB(paths.db);
  config = JSON.parse(readFileSync(paths.config, 'utf-8'));

  // Initialize orchestrators for active projects
  for (const project of db.list().filter(p => p.active)) {
    // Ensure project.json exists (may not if registered via CLI only)
    const projectPaths = paths.forProject(project.id);
    mkdirSync(projectPaths.dir, { recursive: true });
    if (!existsSync(projectPaths.projectJson)) {
      writeFileSync(projectPaths.projectJson, JSON.stringify({
        name: project.name,
        path: project.path,
        registeredAt: project.registeredAt,
      }, null, 2));
    }

    const orch = new Orchestrator({ projectId: project.id, paths, config });
    orch.init();
    orchestrators.set(project.id, orch);
  }

  // Start API server
  server = createServer(getContext);
  const port = config.server?.port || 3700;
  await server.start(port);

  // Wire orchestrators to WebSocket
  for (const orch of orchestrators.values()) {
    server.wireOrchestrator(orch);
  }

  // Start orchestrator loops
  for (const orch of orchestrators.values()) {
    orch.startLoop().catch(err => console.error('Loop error:', err));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  }

  mainWindow.webContents.on('did-fail-load', (event, code, desc) => {
    console.error('Failed to load:', code, desc);
  });
}

app.whenReady().then(async () => {
  setupIpc(getContext);
  await initBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

let isShuttingDown = false;

function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  const shutdownLog = createLogger('shutdown', '\x1b[31m');
  shutdownLog.info('shutting down...');

  // Stop orchestrator loops
  for (const orch of orchestrators.values()) {
    orch.stop();
  }

  // Kill running agents gracefully
  for (const orch of orchestrators.values()) {
    orch.killRunningAgents();
  }

  // Stop server
  if (server) server.stop();

  shutdownLog.info('waiting 5s for agents to finish...');
  setTimeout(() => {
    shutdownLog.info('exiting');
    app.exit(0);
  }, 5000);
}

app.on('before-quit', (e) => {
  if (!isShuttingDown) {
    e.preventDefault();
    gracefulShutdown();
  }
});

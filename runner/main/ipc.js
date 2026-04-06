// runner/main/ipc.js
import { ipcMain, dialog, shell } from 'electron';
import { readFileSync, existsSync, readdirSync, unlinkSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { createLogger } from './logger.js';

const log = createLogger('ipc', '\x1b[34m');

export function setupIpc(getContext) {
  ipcMain.handle('get-projects', () => {
    const { db, orchestrators } = getContext();
    return db.list().map(p => {
      const orch = orchestrators.get(p.id);
      const tasks = orch ? orch.getTasks() : [];
      return {
        ...p,
        taskCounts: {
          total: tasks.length,
          ready: tasks.filter(t => t.status === 'ready').length,
          running: tasks.filter(t => t.status === 'in_progress').length,
          done: tasks.filter(t => t.status === 'done').length,
          failed: tasks.filter(t => t.status === 'failed').length,
        },
      };
    });
  });

  ipcMain.handle('get-project-status', (event, projectId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.stateManager.getState();
  });

  ipcMain.handle('get-tasks', (event, projectId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return [];
    return orch.getTasks();
  });

  ipcMain.handle('get-task', (event, projectId, taskId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.getTask(taskId);
  });

  ipcMain.handle('create-task', (event, projectId, taskData) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.createTask(taskData);
  });

  ipcMain.handle('retry-task', (event, projectId, taskId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.advanceTask(taskId, 'retry-fresh');
  });

  ipcMain.handle('get-task-logs', (event, projectId, taskId) => {
    const { paths } = getContext();
    const logPath = join(paths.forProject(projectId).logsDir, `${taskId}.log`);
    if (!existsSync(logPath)) return { lines: [] };
    const content = readFileSync(logPath, 'utf-8');
    return { lines: content.split('\n').slice(-200) };
  });

  ipcMain.handle('register-project', async () => {
    const { db, paths, config, orchestrators } = getContext();
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select project folder',
    });
    if (result.canceled || !result.filePaths.length) return null;
    const folderPath = result.filePaths[0];
    const existing = db.findByPath(folderPath);
    if (existing) return existing;
    const name = basename(folderPath);
    const project = db.register(name, folderPath);
    log.info(`registered project: ${name} (${project.id}) → ${folderPath}`);

    // Create project dir + project.json
    const projectPaths = paths.forProject(project.id);
    mkdirSync(projectPaths.dir, { recursive: true });
    writeFileSync(projectPaths.projectJson, JSON.stringify({
      name: project.name,
      path: project.path,
      registeredAt: project.registeredAt,
    }, null, 2));
    log.info(`created project.json for ${project.id}`);

    // Init orchestrator for new project
    const { Orchestrator } = await import('./engine/orchestrator.js');
    const orch = new Orchestrator({ projectId: project.id, paths, config });
    orch.init();
    orchestrators.set(project.id, orch);
    orch.startLoop().catch(err => log.error(`loop error for ${project.id}: ${err}`));
    log.info(`orchestrator started for ${project.id}`);

    return project;
  });

  ipcMain.handle('unregister-project', (event, projectId) => {
    const { db, paths, orchestrators } = getContext();

    // Stop orchestrator if running
    const orch = orchestrators.get(projectId);
    if (orch) {
      orch.stop();
      orch.killRunningAgents();
      orchestrators.delete(projectId);
    }

    // Delete all project state (tasks, logs, status)
    const projectDir = paths.forProject(projectId).dir;
    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true });
      log.info(`deleted project state for ${projectId} at ${projectDir}`);
    }

    db.unregister(projectId);
    return true;
  });

  ipcMain.handle('create-idea', (event, projectId, name, description, autoExecute) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.createIdea(name, description, autoExecute);
  });

  ipcMain.handle('toggle-auto-execute', (event, projectId, taskId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    const task = orch.getTask(taskId);
    if (!task) return null;
    return orch.updateTask(taskId, { auto_execute: !task.auto_execute });
  });

  ipcMain.handle('advance-task', (event, projectId, taskId, action, feedback) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.advanceTask(taskId, action, feedback);
  });

  ipcMain.handle('get-pipeline-files', () => {
    const { paths } = getContext();
    return readTemplateDir(paths.pipelineTemplatesDir);
  });

  ipcMain.handle('get-agent-files', () => {
    const { paths } = getContext();
    return readTemplateDir(paths.agentTemplatesDir);
  });

  ipcMain.handle('delete-task', (event, projectId, taskId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return false;
    const taskPath = join(orch.projectPaths.tasksDir, `${taskId}.json`);
    if (existsSync(taskPath)) {
      unlinkSync(taskPath);
      return true;
    }
    return false;
  });

  ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('get-config', () => {
    const { config } = getContext();
    return config;
  });

  function readTemplateDir(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f.replace('.json', ''),
        filename: f,
        content: JSON.parse(readFileSync(join(dir, f), 'utf-8')),
      }));
  }
}

// runner/main/ipc.js
import { ipcMain, dialog } from 'electron';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

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
    return orch.updateTask(taskId, { status: 'ready' });
  });

  ipcMain.handle('get-task-logs', (event, projectId, taskId) => {
    const { paths } = getContext();
    const logPath = join(paths.forProject(projectId).logsDir, `${taskId}.log`);
    if (!existsSync(logPath)) return { lines: [] };
    const content = readFileSync(logPath, 'utf-8');
    return { lines: content.split('\n').slice(-200) };
  });

  ipcMain.handle('register-project', async () => {
    const { db } = getContext();
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select project folder',
    });
    if (result.canceled || !result.filePaths.length) return null;
    const folderPath = result.filePaths[0];
    const existing = db.findByPath(folderPath);
    if (existing) return existing;
    const name = basename(folderPath);
    return db.register(name, folderPath);
  });

  ipcMain.handle('unregister-project', (event, projectId) => {
    const { db } = getContext();
    db.unregister(projectId);
    return true;
  });

  ipcMain.handle('create-idea', (event, projectId, name) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.createIdea(name);
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

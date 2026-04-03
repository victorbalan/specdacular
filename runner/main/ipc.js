// runner/main/ipc.js
import { ipcMain } from 'electron';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

  ipcMain.handle('get-config', () => {
    const { config } = getContext();
    return config;
  });
}

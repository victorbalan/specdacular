// runner/main/server/api.js
import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export function createApiRouter(getContext) {
  const router = Router();

  // Find project by path (for skill auto-detection) — must be before :id routes
  router.get('/projects/by-path', (req, res) => {
    const { db } = getContext();
    const folderPath = req.query.path;
    if (!folderPath) return res.status(400).json({ error: 'path query param required' });
    const project = db.findByPath(folderPath);
    if (!project) return res.status(404).json({ error: 'No project matches this path' });
    res.json(project);
  });

  // List projects
  router.get('/projects', (req, res) => {
    const { db, orchestrators } = getContext();
    const projects = db.list().map(p => {
      const orch = orchestrators.get(p.id);
      const tasks = orch ? orch.getTasks() : [];
      return {
        ...p,
        taskCounts: {
          total: tasks.length,
          idea: tasks.filter(t => t.status === 'idea').length,
          planning: tasks.filter(t => t.status === 'planning').length,
          review: tasks.filter(t => t.status === 'review').length,
          ready: tasks.filter(t => t.status === 'ready').length,
          running: tasks.filter(t => t.status === 'in_progress').length,
          done: tasks.filter(t => t.status === 'done').length,
          failed: tasks.filter(t => t.status === 'failed').length,
        },
      };
    });
    res.json(projects);
  });

  // Global status
  router.get('/status', (req, res) => {
    const { orchestrators } = getContext();
    const status = {};
    for (const [id, orch] of orchestrators) {
      status[id] = orch.stateManager.getState();
    }
    res.json(status);
  });

  // Project status
  router.get('/projects/:id/status', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });
    res.json(orch.stateManager.getState());
  });

  // List tasks
  router.get('/projects/:id/tasks', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });
    res.json(orch.getTasks());
  });

  // Get task
  router.get('/projects/:id/tasks/:taskId', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });
    const task = orch.getTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  // Create task
  router.post('/projects/:id/tasks', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });
    if (!req.body.name) return res.status(400).json({ error: 'name is required' });

    const task = {
      id: req.body.id || `task-${randomUUID().slice(0, 6)}`,
      name: req.body.name,
      description: req.body.description || '',
      project_id: req.params.id,
      working_dir: req.body.working_dir || '.',
      pipeline: req.body.pipeline || 'default',
      status: req.body.status || 'ready',
      priority: req.body.priority || 10,
      depends_on: req.body.depends_on || [],
      spec: req.body.spec || '',
      created_at: new Date().toISOString(),
    };

    orch.createTask(task);
    res.status(201).json(task);
  });

  // Retry task
  router.post('/projects/:id/tasks/:taskId/retry', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const mode = req.body.mode || 'fresh';
    const action = mode === 'feedback' ? 'retry-feedback' : 'retry-fresh';
    const result = orch.advanceTask(req.params.taskId, action, req.body.feedback);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json(result);
  });

  // Advance task (plan, approve, re-plan, retry)
  router.post('/projects/:id/tasks/:taskId/advance', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const { action, feedback } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });

    const result = orch.advanceTask(req.params.taskId, action, feedback);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json(result);
  });

  // Task logs
  router.get('/projects/:id/tasks/:taskId/logs', (req, res) => {
    const { paths } = getContext();
    const logPath = join(paths.forProject(req.params.id).logsDir, `${req.params.taskId}.log`);
    if (!existsSync(logPath)) return res.status(404).json({ error: 'Log not found' });

    const content = readFileSync(logPath, 'utf-8');
    const lines = content.split('\n');
    const tail = parseInt(req.query.tail) || 200;
    res.json({ lines: lines.slice(-tail) });
  });

  return router;
}

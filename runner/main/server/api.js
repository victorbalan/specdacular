// runner/main/server/api.js
import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { TemplateManager } from '../template-manager.js';

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

  // Global pipeline list
  router.get('/pipelines', (req, res) => {
    const { paths } = getContext();
    const tm = new TemplateManager(paths);
    const pipelines = tm.getPipelines();
    res.json(Object.entries(pipelines).map(([name, config]) => ({
      name,
      description: config.description || '',
      stages: (config.stages || []).map(s => ({ name: s.stage, agent: s.agent })),
    })));
  });

  // Global agent list
  router.get('/agents', (req, res) => {
    const { paths } = getContext();
    const tm = new TemplateManager(paths);
    const agents = tm.getAgents();
    res.json(Object.entries(agents).map(([name, config]) => ({
      name,
      cmd: config.cmd,
      output_format: config.output_format,
    })));
  });

  // Update pipeline
  router.put('/pipelines/:name', (req, res) => {
    const { paths } = getContext();
    const filePath = join(paths.pipelineTemplatesDir, `${req.params.name}.json`);
    writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    res.json({ status: 'ok', name: req.params.name });
  });

  // Update agent
  router.put('/agents/:name', (req, res) => {
    const { paths } = getContext();
    const filePath = join(paths.agentTemplatesDir, `${req.params.name}.json`);
    writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    res.json({ status: 'ok', name: req.params.name });
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
      pipeline: req.body.pipeline || null,
      status: req.body.status || 'idea',
      priority: req.body.priority || 10,
      depends_on: req.body.depends_on || [],
      spec: req.body.spec || '',
      feedback: '',
      auto_execute: !!req.body.auto_execute,
      pr_url: null,
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

    const task = orch.updateTask(req.params.taskId, { status: 'ready' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
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

  // Execution context for a task
  router.get('/projects/:id/tasks/:taskId/context', (req, res) => {
    const { paths } = getContext();
    const contextPath = join(paths.forProject(req.params.id).dir, 'contexts', `${req.params.taskId}.json`);
    if (!existsSync(contextPath)) return res.status(404).json({ error: 'Context not found' });
    res.json(JSON.parse(readFileSync(contextPath, 'utf-8')));
  });

  return router;
}

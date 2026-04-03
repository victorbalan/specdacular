const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function createApiRouter(daemon) {
  const router = express.Router();

  router.get('/projects', (req, res) => {
    const projects = daemon.listProjects().map(p => {
      const orch = daemon.getOrchestrator(p.name);
      const state = orch?.stateManager.getState();
      const taskCount = state ? Object.keys(state.tasks).length : 0;
      const running = orch ? orch.runningTasks.size : 0;
      return { ...p, taskCount, running };
    });
    res.json(projects);
  });

  router.get('/status', (req, res) => {
    const result = { projects: {} };
    for (const [name, orch] of daemon.getAllOrchestrators()) {
      const state = orch.stateManager.getState();
      const taskFiles = _scanTaskFiles(orch.tasksDir);
      for (const tf of taskFiles) {
        if (!state.tasks[tf.id]) {
          state.tasks[tf.id] = {
            name: tf.name,
            status: tf.status === 'ready' ? 'queued' : tf.status,
            current_stage: null,
            pipeline: tf.pipeline || 'default',
            stages: [],
          };
        }
      }
      result.projects[name] = state;
    }
    res.json(result);
  });

  router.get('/projects/:project/status', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const state = orch.stateManager.getState();
    const taskFiles = _scanTaskFiles(orch.tasksDir);
    for (const tf of taskFiles) {
      if (!state.tasks[tf.id]) {
        state.tasks[tf.id] = {
          name: tf.name,
          status: tf.status === 'ready' ? 'queued' : tf.status,
          current_stage: null,
          pipeline: tf.pipeline || 'default',
          stages: [],
        };
      }
    }
    res.json(state);
  });

  router.get('/projects/:project/tasks', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const state = orch.stateManager.getState();
    const taskFiles = _scanTaskFiles(orch.tasksDir);
    const merged = {};
    for (const tf of taskFiles) {
      merged[tf.id] = state.tasks[tf.id] || {
        name: tf.name, status: tf.status === 'ready' ? 'queued' : tf.status,
        current_stage: null, pipeline: tf.pipeline || 'default', stages: [],
      };
    }
    for (const [id, task] of Object.entries(state.tasks)) {
      if (!merged[id]) merged[id] = task;
    }
    res.json(Object.entries(merged).map(([id, task]) => ({ id, ...task })));
  });

  router.get('/projects/:project/tasks/:id/logs', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const logFile = path.join(orch.logsDir, `${req.params.id}.log`);
    if (!fs.existsSync(logFile)) return res.json({ lines: [] });

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    const tail = parseInt(req.query.tail) || 200;
    res.json({ lines: lines.slice(-tail) });
  });

  router.post('/projects/:project/tasks/:id/retry', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const taskId = req.params.id;
    const state = orch.stateManager.getState();
    const task = state.tasks[taskId];
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'failed') return res.status(400).json({ error: 'Task is not failed' });

    const taskFile = path.join(orch.tasksDir, `${taskId}.yaml`);
    if (fs.existsSync(taskFile)) {
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      data.status = 'ready';
      fs.writeFileSync(taskFile, yaml.dump(data));
    }

    orch.completedTasks.delete(taskId);
    orch.stateManager.updateTaskStatus(taskId, 'queued');
    orch.stateManager.persist();
    res.json({ status: 'queued', message: `Task ${taskId} queued for retry` });
  });

  router.post('/projects/:project/tasks/:id/skip', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const taskId = req.params.id;
    orch.completedTasks.add(taskId);
    orch.stateManager.updateTaskStatus(taskId, 'done');
    orch.stateManager.persist();
    res.json({ status: 'skipped', message: `Task ${taskId} marked as done` });
  });

  router.post('/projects', (req, res) => {
    const { name, repoPath } = req.body;
    if (!repoPath) return res.status(400).json({ error: 'repoPath required' });
    try {
      const entry = daemon.registerProject(name, repoPath);
      daemon.initProject(entry.name).then(orch => {
        orch.startLoop().catch(e => console.error(`[${entry.name}] Loop error: ${e.message}`));
      });
      res.json(entry);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return router;
}

function _scanTaskFiles(tasksDir) {
  if (!fs.existsSync(tasksDir)) return [];
  return fs.readdirSync(tasksDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
    .map(f => {
      try {
        const ext = path.extname(f);
        const id = path.basename(f, ext);
        const data = yaml.load(fs.readFileSync(path.join(tasksDir, f), 'utf8'));
        return { id, ...data };
      } catch (e) { return null; }
    })
    .filter(Boolean);
}

module.exports = { createApiRouter };

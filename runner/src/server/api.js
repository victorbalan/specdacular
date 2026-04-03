const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function createApiRouter(orchestrator) {
  const router = express.Router();

  router.get('/status', (req, res) => {
    // Merge task files with runtime state so all tasks show up
    const state = orchestrator.stateManager.getState();
    const taskFiles = _scanTaskFiles(orchestrator.tasksDir);

    // Add task file entries that aren't in runtime state yet
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

  router.get('/tasks', (req, res) => {
    const state = orchestrator.stateManager.getState();
    const taskFiles = _scanTaskFiles(orchestrator.tasksDir);

    // Merge file-based tasks with runtime state
    const merged = {};
    for (const tf of taskFiles) {
      merged[tf.id] = state.tasks[tf.id] || {
        name: tf.name,
        status: tf.status === 'ready' ? 'queued' : tf.status,
        current_stage: null,
        pipeline: tf.pipeline || 'default',
        stages: [],
      };
    }
    // Also include any runtime tasks not in files (e.g., completed/archived)
    for (const [id, task] of Object.entries(state.tasks)) {
      if (!merged[id]) merged[id] = task;
    }

    const tasks = Object.entries(merged).map(([id, task]) => ({ id, ...task }));
    res.json(tasks);
  });

  router.get('/tasks/:id/logs', (req, res) => {
    const taskId = req.params.id;
    const state = orchestrator.stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const currentStage = task.current_stage;
    if (!currentStage) return res.json({ lines: [] });

    const logFile = path.join(orchestrator.logsDir, `${taskId}-${currentStage}.log`);
    if (!fs.existsSync(logFile)) return res.json({ lines: [] });

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    const tail = parseInt(req.query.tail) || 100;
    res.json({ lines: lines.slice(-tail) });
  });

  router.post('/tasks/:id/retry', (req, res) => {
    const taskId = req.params.id;
    const state = orchestrator.stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'failed') return res.status(400).json({ error: 'Task is not failed' });

    const taskFile = path.join(orchestrator.tasksDir, `${taskId}.yaml`);
    if (fs.existsSync(taskFile)) {
      const yaml = require('js-yaml');
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      data.status = 'ready';
      fs.writeFileSync(taskFile, yaml.dump(data));
    }

    orchestrator.completedTasks.delete(taskId);
    orchestrator.stateManager.updateTaskStatus(taskId, 'queued');
    orchestrator.stateManager.persist();

    res.json({ status: 'queued', message: `Task ${taskId} queued for retry` });
  });

  router.post('/tasks/:id/skip', (req, res) => {
    const taskId = req.params.id;
    const state = orchestrator.stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) return res.status(404).json({ error: 'Task not found' });

    orchestrator.completedTasks.add(taskId);
    orchestrator.stateManager.updateTaskStatus(taskId, 'done');
    orchestrator.stateManager.persist();

    res.json({ status: 'skipped', message: `Task ${taskId} marked as done (skipped)` });
  });

  router.post('/tasks/:id/pause', (req, res) => {
    res.json({ status: 'acknowledged', message: 'Pause not yet implemented' });
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
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = { createApiRouter };

const express = require('express');
const fs = require('fs');
const path = require('path');

function createApiRouter(orchestrator) {
  const router = express.Router();

  router.get('/status', (req, res) => {
    res.json(orchestrator.stateManager.getState());
  });

  router.get('/tasks', (req, res) => {
    const state = orchestrator.stateManager.getState();
    const tasks = Object.entries(state.tasks).map(([id, task]) => ({ id, ...task }));
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

module.exports = { createApiRouter };

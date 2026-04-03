const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateConfig, validateAgent, validatePipeline, validateTask } = require('./schema');

class ConfigLoader {
  constructor(configDir) {
    this.configDir = configDir;
  }

  readYaml(filename) {
    const filePath = path.join(this.configDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  }

  resolveEnvVars(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] || '');
  }

  resolveEnvVarsDeep(obj) {
    if (typeof obj === 'string') return this.resolveEnvVars(obj);
    if (Array.isArray(obj)) return obj.map(v => this.resolveEnvVarsDeep(v));
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, val] of Object.entries(obj)) {
        result[key] = this.resolveEnvVarsDeep(val);
      }
      return result;
    }
    return obj;
  }

  async loadConfig() {
    const raw = this.readYaml('config.yaml');
    const config = this.resolveEnvVarsDeep(raw);
    const errors = validateConfig(config);
    if (errors.length > 0) throw new Error(`Config validation failed:\n${errors.join('\n')}`);
    return config;
  }

  async loadAgents() {
    const raw = this.readYaml('agents.yaml');
    const agents = raw.agents || {};
    const errors = [];
    for (const [name, agent] of Object.entries(agents)) {
      errors.push(...validateAgent(name, agent));
    }
    if (errors.length > 0) throw new Error(`Agent validation failed:\n${errors.join('\n')}`);
    return agents;
  }

  async loadPipelines() {
    const raw = this.readYaml('pipelines.yaml');
    const pipelines = raw.pipelines || {};
    const errors = [];
    for (const [name, pipeline] of Object.entries(pipelines)) {
      errors.push(...validatePipeline(name, pipeline));
    }
    if (errors.length > 0) throw new Error(`Pipeline validation failed:\n${errors.join('\n')}`);
    return pipelines;
  }

  async loadTasks() {
    const tasksDir = path.join(this.configDir, 'tasks');
    if (!fs.existsSync(tasksDir)) return [];

    const files = fs.readdirSync(tasksDir)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .sort();

    const tasks = [];
    const errors = [];

    for (const file of files) {
      const id = path.basename(file, path.extname(file));
      const raw = yaml.load(fs.readFileSync(path.join(tasksDir, file), 'utf8'));
      const task = { id, ...raw };
      errors.push(...validateTask(id, task));
      tasks.push(task);
    }

    if (errors.length > 0) throw new Error(`Task validation failed:\n${errors.join('\n')}`);
    return tasks;
  }

  async loadAll() {
    const [config, agents, pipelines, tasks] = await Promise.all([
      this.loadConfig(),
      this.loadAgents(),
      this.loadPipelines(),
      this.loadTasks(),
    ]);
    return { config, agents, pipelines, tasks };
  }
}

module.exports = { ConfigLoader };

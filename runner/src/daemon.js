const fs = require('fs');
const path = require('path');
const { Paths } = require('./paths');
const { ProjectRegistry } = require('./registry');
const { Orchestrator } = require('./orchestrator');

class Daemon {
  constructor(homeBase) {
    this.paths = new Paths(homeBase);
    this.registry = new ProjectRegistry(this.paths.registryPath);
    this.orchestrators = new Map();
  }

  registerProject(name, repoPath) {
    const projectName = name || path.basename(repoPath);
    const configPaths = this.paths.configPaths(repoPath);

    if (!fs.existsSync(configPaths.configDir)) {
      throw new Error(`No .specd/runner/ found in ${repoPath}`);
    }

    const entry = this.registry.register(projectName, repoPath);
    this.paths.ensureDirs(projectName);

    console.log(`Registered project: ${projectName} → ${repoPath}`);
    return entry;
  }

  unregisterProject(name) {
    const orch = this.orchestrators.get(name);
    if (orch) {
      orch.stop();
      this.orchestrators.delete(name);
    }
    this.registry.unregister(name);
    console.log(`Unregistered project: ${name}`);
  }

  listProjects() {
    return this.registry.list();
  }

  async initProject(projectName) {
    const project = this.registry.get(projectName);
    if (!project) throw new Error(`Project "${projectName}" not registered`);

    const configPaths = this.paths.configPaths(project.repoPath);
    const runtimePaths = this.paths.forProject(projectName);

    this.paths.ensureDirs(projectName);

    const orch = new Orchestrator({
      configDir: configPaths.configDir,
      tasksDir: configPaths.tasksDir,
      statusPath: runtimePaths.statusPath,
      logsDir: runtimePaths.logsDir,
      projectName,
    });

    await orch.init();
    this.orchestrators.set(projectName, orch);
    return orch;
  }

  async startAll() {
    const projects = this.registry.list();
    console.log(`Starting ${projects.length} project(s)...`);

    for (const project of projects) {
      try {
        const orch = await this.initProject(project.name);
        const promise = orch.startLoop();
        promise.catch(e => console.error(`[${project.name}] Loop error: ${e.message}`));
        console.log(`[${project.name}] Started`);
      } catch (e) {
        console.error(`[${project.name}] Failed to start: ${e.message}`);
      }
    }
  }

  stopAll() {
    for (const [name, orch] of this.orchestrators) {
      orch.stop();
      console.log(`[${name}] Stopped`);
    }
    this.orchestrators.clear();
  }

  getOrchestrator(projectName) {
    return this.orchestrators.get(projectName) || null;
  }

  getAllOrchestrators() {
    return this.orchestrators;
  }
}

module.exports = { Daemon };

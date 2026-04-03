const path = require('path');
const os = require('os');

class Paths {
  constructor(homeBase) {
    this.homeDir = homeBase || path.join(os.homedir(), '.specd', 'runner');
    this.registryPath = path.join(this.homeDir, 'projects.json');
    this.personalConfigPath = path.join(this.homeDir, 'config.yaml');
  }

  forProject(projectName) {
    const projectDir = path.join(this.homeDir, 'projects', projectName);
    return {
      projectDir,
      statusPath: path.join(projectDir, 'status.json'),
      logsDir: path.join(projectDir, 'logs'),
    };
  }

  configPaths(repoPath) {
    const configDir = path.join(repoPath, '.specd', 'runner');
    return {
      configDir,
      tasksDir: path.join(configDir, 'tasks'),
      configYaml: path.join(configDir, 'config.yaml'),
      agentsYaml: path.join(configDir, 'agents.yaml'),
      pipelinesYaml: path.join(configDir, 'pipelines.yaml'),
    };
  }

  ensureDirs(projectName) {
    const fs = require('fs');
    const rt = this.forProject(projectName);
    fs.mkdirSync(rt.logsDir, { recursive: true });
    fs.mkdirSync(path.dirname(this.registryPath), { recursive: true });
  }
}

module.exports = { Paths };

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

export class TemplateManager {
  constructor(paths) {
    this.paths = paths;
  }

  getAgents(projectId) {
    const global = this._loadDir(this.paths.agentTemplatesDir);
    if (!projectId) return global;

    const projectAgentsDir = join(this.paths.projectsDir, projectId, 'agents');
    if (!existsSync(projectAgentsDir)) return global;

    const overrides = this._loadDir(projectAgentsDir);
    return { ...global, ...overrides };
  }

  getPipelines(projectId) {
    const global = this._loadDir(this.paths.pipelineTemplatesDir);
    if (!projectId) return global;

    const projectPipelinesDir = join(this.paths.projectsDir, projectId, 'pipelines');
    if (!existsSync(projectPipelinesDir)) return global;

    const overrides = this._loadDir(projectPipelinesDir);
    return { ...global, ...overrides };
  }

  _loadDir(dir) {
    if (!existsSync(dir)) return {};
    const result = {};
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const name = basename(file, '.json');
      result[name] = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    }
    return result;
  }
}

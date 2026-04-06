// runner/main/template-manager.js
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

export class TemplateManager {
  constructor(paths) {
    this.paths = paths;
  }

  getAgents() {
    return this._loadDir(this.paths.agentTemplatesDir);
  }

  getPipelines() {
    return this._loadDir(this.paths.pipelineTemplatesDir);
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

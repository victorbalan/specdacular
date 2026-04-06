// runner/main/paths.js
import { join } from 'path';
import { homedir, platform } from 'os';

export class Paths {
  constructor(root) {
    this.root = root || Paths.defaultRoot();
  }

  static defaultRoot() {
    if (platform() === 'darwin') {
      return join(homedir(), 'Library', 'Application Support', 'Specd');
    }
    return join(homedir(), '.config', 'specd');
  }

  get db() { return join(this.root, 'db.json'); }
  get config() { return join(this.root, 'config.json'); }
  get templatesDir() { return join(this.root, 'templates'); }
  get agentTemplatesDir() { return join(this.root, 'templates', 'agents'); }
  get pipelineTemplatesDir() { return join(this.root, 'templates', 'pipelines'); }
  get projectsDir() { return join(this.root, 'projects'); }
  get actionsDir() { return join(this.root, 'actions'); }
  get electronDir() { return join(this.root, 'electron'); }

  forProject(projectId) {
    const dir = join(this.root, 'projects', projectId);
    return {
      dir,
      projectJson: join(dir, 'project.json'),
      statusJson: join(dir, 'status.json'),
      tasksDir: join(dir, 'tasks'),
      logsDir: join(dir, 'logs'),
    };
  }
}

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const fixturesDir = path.join(__dirname, '..', 'fixtures');

describe('ConfigLoader', () => {
  let loadConfig;

  it('should load before importing', () => {
    const { ConfigLoader } = require('../../src/config/loader');
    loadConfig = ConfigLoader;
  });

  it('loads config.yaml', async () => {
    const loader = new loadConfig(fixturesDir);
    const config = await loader.loadConfig();
    assert.strictEqual(config.server.port, 3700);
    assert.strictEqual(config.defaults.timeout, 3600);
    assert.strictEqual(config.defaults.stuck_timeout, 1800);
    assert.strictEqual(config.defaults.pipeline, 'default');
  });

  it('loads agents.yaml', async () => {
    const loader = new loadConfig(fixturesDir);
    const agents = await loader.loadAgents();
    assert.ok(agents['test-agent']);
    assert.strictEqual(agents['test-agent'].cmd, 'echo');
    assert.ok(agents['test-agent'].system_prompt.includes('{{task.name}}'));
  });

  it('loads pipelines.yaml', async () => {
    const loader = new loadConfig(fixturesDir);
    const pipelines = await loader.loadPipelines();
    assert.ok(pipelines['default']);
    assert.ok(pipelines['bug-fix']);
    assert.strictEqual(pipelines['default'].stages.length, 3);
    assert.strictEqual(pipelines['default'].stages[0].stage, 'plan');
  });

  it('loads task files from tasks/', async () => {
    const loader = new loadConfig(fixturesDir);
    const tasks = await loader.loadTasks();
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].id, '001-test-task');
    assert.strictEqual(tasks[0].name, 'Test task');
    assert.strictEqual(tasks[0].status, 'ready');
    assert.strictEqual(tasks[0].pipeline, 'default');
  });

  it('loadAll returns complete config', async () => {
    const loader = new loadConfig(fixturesDir);
    const all = await loader.loadAll();
    assert.ok(all.config);
    assert.ok(all.agents);
    assert.ok(all.pipelines);
    assert.ok(all.tasks);
  });

  it('resolves env vars in config values', async () => {
    process.env.TEST_TOKEN = 'my-token';
    const loader = new loadConfig(fixturesDir);
    const result = loader.resolveEnvVars('${TEST_TOKEN}');
    assert.strictEqual(result, 'my-token');
    delete process.env.TEST_TOKEN;
  });
});

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Readable } = require('stream');

describe('StreamParser', () => {
  let StreamParser;

  it('imports', () => {
    ({ StreamParser } = require('../../src/agent/parser'));
  });

  it('parses specd-status blocks', async () => {
    const input = `Some output text
\`\`\`specd-status
{
  "task_id": "001-auth",
  "stage": "implement",
  "progress": "writing middleware",
  "percent": 40,
  "files_touched": ["src/auth.ts"]
}
\`\`\`
More output text`;

    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    const statuses = [];
    parser.on('status', (s) => statuses.push(s));
    await parser.start();
    assert.strictEqual(statuses.length, 1);
    assert.strictEqual(statuses[0].progress, 'writing middleware');
    assert.strictEqual(statuses[0].percent, 40);
  });

  it('parses specd-result blocks', async () => {
    const input = `Working on stuff...
\`\`\`specd-result
{
  "status": "success",
  "summary": "implemented auth",
  "files_changed": ["src/auth.ts"],
  "issues": [],
  "next_suggestions": []
}
\`\`\``;

    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    let result = null;
    parser.on('result', (r) => { result = r; });
    await parser.start();
    assert.ok(result);
    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.summary, 'implemented auth');
  });

  it('emits output events for non-block lines', async () => {
    const input = 'line 1\nline 2\n';
    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    const lines = [];
    parser.on('output', (line) => lines.push(line));
    await parser.start();
    assert.ok(lines.length >= 1);
  });

  it('handles multiple status blocks in one stream', async () => {
    const input = `start
\`\`\`specd-status
{"task_id":"x","stage":"a","progress":"step 1","percent":25,"files_touched":[]}
\`\`\`
middle
\`\`\`specd-status
{"task_id":"x","stage":"a","progress":"step 2","percent":75,"files_touched":["f.js"]}
\`\`\`
end`;

    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    const statuses = [];
    parser.on('status', (s) => statuses.push(s));
    await parser.start();
    assert.strictEqual(statuses.length, 2);
    assert.strictEqual(statuses[0].percent, 25);
    assert.strictEqual(statuses[1].percent, 75);
  });
});

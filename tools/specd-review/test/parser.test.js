// test/parser.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { StreamParser } from '../src/parser.js';

describe('StreamParser', () => {
  it('emits result blocks as parsed JSON', () => {
    const p = new StreamParser();
    const results = [];
    p.on('result', (r) => results.push(r));
    p.feed('```specd-result');
    p.feed('{"summary":"ok","findings":[]}');
    p.feed('```');
    a.equal(results.length, 1);
    a.equal(results[0].summary, 'ok');
  });

  it('emits status blocks and passes other lines through as output', () => {
    const p = new StreamParser();
    const statuses = [];
    const output = [];
    p.on('status', (s) => statuses.push(s));
    p.on('output', (l) => output.push(l));
    p.feed('hello');
    p.feed('```specd-status');
    p.feed('{"progress":"Reviewing"}');
    p.feed('```');
    a.equal(output[0], 'hello');
    a.equal(statuses[0].progress, 'Reviewing');
  });

  it('ignores malformed JSON in a block', () => {
    const p = new StreamParser();
    const results = [];
    p.on('result', (r) => results.push(r));
    p.feed('```specd-result');
    p.feed('{not json');
    p.feed('```');
    a.equal(results.length, 0);
  });
});

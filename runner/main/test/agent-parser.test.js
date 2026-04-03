import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { StreamParser } from '../agent/parser.js';

describe('StreamParser', () => {
  it('parses specd-status blocks', () => {
    const parser = new StreamParser();
    const statuses = [];
    parser.on('status', (s) => statuses.push(s));

    parser.feed('some output');
    parser.feed('```specd-status');
    parser.feed('{"progress":"Working","percent":50}');
    parser.feed('```');

    a.equal(statuses.length, 1);
    a.equal(statuses[0].progress, 'Working');
    a.equal(statuses[0].percent, 50);
  });

  it('parses specd-result blocks', () => {
    const parser = new StreamParser();
    const results = [];
    parser.on('result', (r) => results.push(r));

    parser.feed('```specd-result');
    parser.feed('{"status":"success","summary":"Done"}');
    parser.feed('```');

    a.equal(results.length, 1);
    a.equal(results[0].status, 'success');
  });

  it('emits output for non-block lines', () => {
    const parser = new StreamParser();
    const lines = [];
    parser.on('output', (l) => lines.push(l));

    parser.feed('hello world');

    a.equal(lines.length, 1);
    a.equal(lines[0], 'hello world');
  });
});

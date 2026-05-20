import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../src/config.js';

let globalDir, projectDir;

function writeAgent(dir, name, body) {
  mkdirSync(join(dir, 'agents'), { recursive: true });
  writeFileSync(join(dir, 'agents', `${name}.yml`), body);
}

beforeEach(() => {
  globalDir = mkdtempSync(join(tmpdir(), 'sr-global-'));
  projectDir = mkdtempSync(join(tmpdir(), 'sr-project-'));
});
afterEach(() => {
  rmSync(globalDir, { recursive: true, force: true });
  rmSync(projectDir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('loads agents and splits reviewers from the fixer', () => {
    writeFileSync(join(globalDir, 'config.yml'), 'max_rounds: 4\n');
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "r {{diff}}"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f {{findings}}"\n');
    const cfg = loadConfig({ globalDir, projectDir });
    a.equal(cfg.maxRounds, 4);
    a.equal(cfg.reviewers.length, 1);
    a.equal(cfg.reviewers[0].name, 'rev');
    a.equal(cfg.fixer.name, 'fix');
  });

  it('lets a project agent file shadow a global one of the same name', () => {
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "global"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f"\n');
    writeAgent(projectDir, 'rev', 'role: reviewer\ncmd: "project"\nsystem_prompt: "x"\n');
    const cfg = loadConfig({ globalDir, projectDir });
    a.equal(cfg.reviewers[0].cmd, 'project');
  });

  it('honors a cliAgents selection override', () => {
    writeAgent(globalDir, 'a', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'b', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f"\n');
    const cfg = loadConfig({ globalDir, projectDir, cliAgents: ['a', 'fix'] });
    a.equal(cfg.reviewers.length, 1);
    a.equal(cfg.reviewers[0].name, 'a');
  });

  it('throws when there is not exactly one fixer', () => {
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    a.throws(() => loadConfig({ globalDir, projectDir }), /exactly one fixer/i);
  });

  it('defaults max_rounds to 5 when config.yml is absent', () => {
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f"\n');
    a.equal(loadConfig({ globalDir, projectDir }).maxRounds, 5);
  });
});

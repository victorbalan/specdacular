#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();
program
  .name('specd-review')
  .description('Iterative multi-agent code review CLI')
  .version('0.1.0');

program.parse();

#!/usr/bin/env node
// Mock agent that reads prompt from args and emits specd blocks

const prompt = process.argv.slice(2).join(' ');

console.log(`Received prompt: ${prompt.substring(0, 50)}...`);
console.log('Working on it...');

// Emit a status update
console.log('```specd-status');
console.log(JSON.stringify({
  task_id: 'test',
  stage: 'test',
  progress: 'doing work',
  percent: 50,
  files_touched: ['test.js'],
}));
console.log('```');

console.log('Almost done...');

// Emit the result
console.log('```specd-result');
console.log(JSON.stringify({
  status: 'success',
  summary: 'did the work',
  files_changed: ['test.js'],
  issues: [],
  next_suggestions: [],
}));
console.log('```');

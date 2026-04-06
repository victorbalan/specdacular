// runner/main/engine/progress/journal-watcher.js
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class JournalWatcher {
  constructor(workingDir) {
    this.journalPath = join(workingDir, '.specd', 'journal.json');
    this.seenCount = 0;
  }

  read() {
    if (!existsSync(this.journalPath)) return [];
    try {
      const entries = JSON.parse(readFileSync(this.journalPath, 'utf-8'));
      if (!Array.isArray(entries)) return [];
      this.seenCount = entries.length;
      return entries;
    } catch {
      return [];
    }
  }

  readNew() {
    if (!existsSync(this.journalPath)) return [];
    try {
      const entries = JSON.parse(readFileSync(this.journalPath, 'utf-8'));
      if (!Array.isArray(entries)) return [];
      const newEntries = entries.slice(this.seenCount);
      this.seenCount = entries.length;
      return newEntries;
    } catch {
      return [];
    }
  }
}

const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_CHANNELS = new Set([
  'get-projects', 'get-project-status', 'get-tasks',
  'get-task', 'create-task', 'retry-task', 'get-task-logs', 'get-config',
  'register-project', 'unregister-project',
]);

contextBridge.exposeInMainWorld('specd', {
  invoke: (channel, ...args) => {
    if (!ALLOWED_CHANNELS.has(channel)) throw new Error(`Blocked IPC channel: ${channel}`);
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel, callback) => {
    if (!ALLOWED_CHANNELS.has(channel)) throw new Error(`Blocked IPC channel: ${channel}`);
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});

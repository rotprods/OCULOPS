// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Electron Preload Script
// ═══════════════════════════════════════════════════

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // System info
    platform: process.platform,

    // Window controls
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),

    // Native notifications
    showNotification: (title, body) => ipcRenderer.send('notification:show', { title, body }),

    // File export (saves to ~/Downloads/AntigravityOS/)
    saveFile: (data, filename) => ipcRenderer.invoke('file:save', { data, filename }),
});

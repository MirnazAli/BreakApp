const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Configuration methods
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (config) => ipcRenderer.invoke('update-config', config),
    
    // Break control methods
    triggerBreak: () => ipcRenderer.invoke('trigger-break'),
    endBreak: () => ipcRenderer.invoke('end-break'),
    
    // Debug methods
    debugLog: (message) => ipcRenderer.invoke('debug-log', message),
    
    // Utility methods
    platform: process.platform,
    
    // Event listeners
    onBreakStart: (callback) => ipcRenderer.on('break-start', callback),
    onBreakEnd: (callback) => ipcRenderer.on('break-end', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
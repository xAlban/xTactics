import { contextBridge } from 'electron'

// ---- Expose safe APIs to the renderer process via context bridge ----
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
})

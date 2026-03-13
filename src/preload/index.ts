import { contextBridge, ipcRenderer } from 'electron'
import type { DownloadOptions } from '@shared/types/download'

// ────────────────────────────────────────────────
// Typed API exposed to renderer via contextBridge
// Per electron-ipc skill: never expose ipcRenderer directly
// ────────────────────────────────────────────────
const api = {
  // Metadata
  fetchMetadata: (url: string, cookiesFromBrowser?: string) =>
    ipcRenderer.invoke('download:fetchMetadata', url, cookiesFromBrowser),

  // Downloads
  startDownload: (url: string, options: DownloadOptions) =>
    ipcRenderer.invoke('download:start', url, options),

  cancelDownload: (jobId: string) => ipcRenderer.invoke('download:cancel', jobId),

  resumeDownload: (jobId: string) => ipcRenderer.invoke('download:resume', jobId),

  // Binaries
  checkAndUpdateBinaries: () => ipcRenderer.invoke('binary:checkAndUpdate'),

  getBinaryStatus: () => ipcRenderer.invoke('binary:getStatus'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),

  setSettings: (settings: object) => ipcRenderer.invoke('settings:set', settings),

  // Clipboard watcher
  toggleClipboard: (enabled: boolean) => ipcRenderer.invoke('clipboard:toggle', enabled),

  // Folder picker
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

  // Event listeners (main → renderer push events)
  onDownloadProgress: (callback: (data: object) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: object) => callback(data)
    ipcRenderer.on('download:progress', handler)
    return () => ipcRenderer.removeListener('download:progress', handler)
  },

  onDownloadCompleted: (callback: (data: object) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: object) => callback(data)
    ipcRenderer.on('download:completed', handler)
    return () => ipcRenderer.removeListener('download:completed', handler)
  },

  onDownloadError: (callback: (data: object) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: object) => callback(data)
    ipcRenderer.on('download:error', handler)
    return () => ipcRenderer.removeListener('download:error', handler)
  },

  onClipboardLink: (callback: (url: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, url: string) => callback(url)
    ipcRenderer.on('clipboard:linkDetected', handler)
    return () => ipcRenderer.removeListener('clipboard:linkDetected', handler)
  },

  // Window Management
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Utilities
  showInFolder: (path: string) => ipcRenderer.invoke('shell:showInFolder', path),
  generateId: () => crypto.randomUUID()
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}

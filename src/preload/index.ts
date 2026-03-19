import { contextBridge, ipcRenderer } from 'electron'
import type { DownloadOptions } from '@shared/types/download'

// ────────────────────────────────────────────────
// Typed API exposed to renderer via contextBridge
// Per electron-ipc skill: never expose ipcRenderer directly
// ────────────────────────────────────────────────
const api = {
  // Metadata
  fetchMetadata: (url: string, cookiesFromBrowser?: string, cookiesManual?: string, cookiesFilePath?: string) =>
    ipcRenderer.invoke('download:fetchMetadata', url, cookiesFromBrowser, cookiesManual, cookiesFilePath),

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
  openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),

  openTxtFileDialog: () => ipcRenderer.invoke('dialog:openTxtFile'),

  // Event listeners (main → renderer push events)
  onDownloadProgress: (callback: (data: object) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: object): void => callback(data)
    ipcRenderer.on('download:progress', handler)
    return () => ipcRenderer.removeListener('download:progress', handler)
  },

  onDownloadCompleted: (callback: (data: object) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: object): void => callback(data)
    ipcRenderer.on('download:completed', handler)
    return () => ipcRenderer.removeListener('download:completed', handler)
  },

  onDownloadError: (callback: (data: object) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: object): void => callback(data)
    ipcRenderer.on('download:error', handler)
    return () => ipcRenderer.removeListener('download:error', handler)
  },

  onClipboardLink: (callback: (url: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, url: string): void => callback(url)
    ipcRenderer.on('clipboard:linkDetected', handler)
    return () => ipcRenderer.removeListener('clipboard:linkDetected', handler)
  },

  // Window Management
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Utilities
  showInFolder: (path: string) => ipcRenderer.invoke('shell:showInFolder', path),
  generateId: () => crypto.randomUUID(),

  // Filesystem
  pathExists: (dirPath: string) => ipcRenderer.invoke('fs:pathExists', dirPath) as Promise<boolean>,
  sanitizeName: (name: string) => ipcRenderer.invoke('fs:sanitizeName', name) as Promise<string>
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

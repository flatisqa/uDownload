import { contextBridge, ipcRenderer } from 'electron'
import type { DownloadOptions } from '@shared/types/download'

// ────────────────────────────────────────────────
// Typed API exposed to renderer via contextBridge
// Per electron-ipc skill: never expose ipcRenderer directly
// ────────────────────────────────────────────────
const api = {
  // Metadata
  fetchMetadata: (
    url: string,
    cookiesFromBrowser?: string,
    cookiesManual?: string,
    cookiesFilePath?: string
  ) =>
    ipcRenderer.invoke(
      'download:fetchMetadata',
      url,
      cookiesFromBrowser,
      cookiesManual,
      cookiesFilePath
    ),

  // Downloads
  startDownload: (
    url: string,
    options: DownloadOptions,
    playlistProgress?: import('@shared/types/download').PlaylistProgress
  ) => ipcRenderer.invoke('download:start', url, options, playlistProgress),

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
  openFolderDialog: (defaultPath?: string) => ipcRenderer.invoke('dialog:openFolder', defaultPath),
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

  onDetectProgress: (
    callback: (progress: import('@shared/types/download').TrackDetectProgress) => void
  ): (() => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      data: import('@shared/types/download').TrackDetectProgress
    ): void => callback(data)
    ipcRenderer.on('audio:detectProgress', handler)
    return () => ipcRenderer.removeListener('audio:detectProgress', handler)
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
  sanitizeName: (name: string) => ipcRenderer.invoke('fs:sanitizeName', name) as Promise<string>,
  checkConflict: (outputPath: string, title: string, isPlaylistOrAlbum: boolean, format: string) =>
    ipcRenderer.invoke(
      'fs:checkConflict',
      outputPath,
      title,
      isPlaylistOrAlbum,
      format
    ) as Promise<{
      exists: boolean
      isDirectory: boolean
      path: string
      name: string
    }>,
  getAppVersion: () => ipcRenderer.invoke('app:getVersion') as Promise<string>,
  detectTracks: (
    url: string,
    totalDuration: number,
    cookies?: {
      cookiesFromBrowser?: string
      cookiesManual?: string
      cookiesFilePath?: string
    },
    options?: import('@shared/types/download').SilenceDetectOptions
  ) =>
    ipcRenderer.invoke('audio:detectTracks', url, totalDuration, cookies, options) as Promise<{
      success: boolean
      data?: import('@shared/types/download').DetectedTrack[]
      error?: string
    }>,
  parseTracklist: (text: string, totalDuration: number) =>
    ipcRenderer.invoke('audio:parseTracklist', text, totalDuration) as Promise<{
      success: boolean
      data?: import('@shared/types/download').DetectedTrack[]
      error?: string
    }>,
  cancelDetectTracks: () =>
    ipcRenderer.invoke('audio:cancelDetectTracks') as Promise<{ success: boolean }>
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

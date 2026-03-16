// Typed preload API declaration for renderer
import type { DownloadOptions, VideoMetadata, AppConfig } from '@shared/types/download'

export interface IElectronAPI {
  fetchMetadata: (
    url: string
  ) => Promise<{ success: boolean; data?: VideoMetadata; error?: string }>
  startDownload: (
    url: string,
    options: DownloadOptions
  ) => Promise<{ success: boolean; data?: string; error?: string }>
  cancelDownload: (jobId: string) => Promise<{ success: boolean }>
  resumeDownload: (jobId: string) => Promise<{ success: boolean }>
  checkAndUpdateBinaries: () => Promise<{ success: boolean; data?: string; error?: string }>
  getBinaryStatus: () => Promise<{ success: boolean; data?: { ytdlp: boolean; ffmpeg: boolean } }>
  getSettings: () => Promise<{ success: boolean; data?: AppConfig }>
  setSettings: (settings: Partial<AppConfig>) => Promise<{ success: boolean }>
  toggleClipboard: (enabled: boolean) => Promise<{ success: boolean }>
  openFolderDialog: () => Promise<{ success: boolean; data?: string }>
  openImageDialog: () => Promise<{ success: boolean; data?: string }>
  showInFolder: (path: string) => Promise<void>
  generateId: () => string
  pathExists: (dirPath: string) => Promise<boolean>
  sanitizeName: (name: string) => Promise<string>
  onDownloadProgress: (callback: (data: object) => void) => () => void
  onDownloadCompleted: (callback: (data: object) => void) => () => void
  onDownloadError: (callback: (data: object) => void) => () => void
  onClipboardLink: (callback: (url: string) => void) => () => void
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}

// Typed preload API declaration for renderer
import type {
  DownloadOptions,
  VideoMetadata,
  AppConfig,
  PlaylistProgress
} from '@shared/types/download'

export interface IElectronAPI {
  // Window management
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  // Metadata & Downloads
  fetchMetadata: (
    url: string,
    cookiesFromBrowser?: string,
    cookiesManual?: string,
    cookiesFilePath?: string
  ) => Promise<{ success: boolean; data?: VideoMetadata; error?: string }>
  startDownload: (
    url: string,
    options: DownloadOptions,
    playlistProgress?: PlaylistProgress
  ) => Promise<{ success: boolean; data?: string; error?: string }>
  cancelDownload: (jobId: string) => Promise<{ success: boolean }>
  resumeDownload: (jobId: string) => Promise<{ success: boolean }>
  checkAndUpdateBinaries: () => Promise<{ success: boolean; data?: string; error?: string }>
  getBinaryStatus: () => Promise<{ success: boolean; data?: { ytdlp: boolean; ffmpeg: boolean } }>
  getSettings: () => Promise<{ success: boolean; data?: AppConfig }>
  setSettings: (settings: Partial<AppConfig>) => Promise<{ success: boolean }>
  toggleClipboard: (enabled: boolean) => Promise<{ success: boolean }>
  openFolderDialog: (defaultPath?: string) => Promise<{ success: boolean; data?: string }>
  openImageDialog: () => Promise<{ success: boolean; data?: string }>
  openTxtFileDialog: () => Promise<{ success: boolean; data?: string }>
  showInFolder: (path: string) => Promise<void>
  generateId: () => string
  pathExists: (dirPath: string) => Promise<boolean>
  sanitizeName: (name: string) => Promise<string>
  checkConflict: (
    outputPath: string,
    title: string,
    isPlaylistOrAlbum: boolean,
    format: string
  ) => Promise<{ exists: boolean; isDirectory: boolean; path: string; name: string }>
  getAppVersion: () => Promise<string>
  detectTracks: (
    url: string,
    totalDuration: number,
    cookies?: {
      cookiesFromBrowser?: string
      cookiesManual?: string
      cookiesFilePath?: string
    },
    options?: import('@shared/types/download').SilenceDetectOptions
  ) => Promise<{
    success: boolean
    data?: import('@shared/types/download').DetectedTrack[]
    error?: string
  }>
  parseTracklist: (
    text: string,
    totalDuration: number
  ) => Promise<{
    success: boolean
    data?: import('@shared/types/download').DetectedTrack[]
    error?: string
  }>
  cancelDetectTracks: () => Promise<{ success: boolean }>

  // Dependencies check
  checkDependencies: () => Promise<{
    success: boolean
    data?: { ytDlp: boolean; ffmpeg: boolean; allInstalled: boolean }
    error?: string
  }>
  isFirstRun: () => Promise<{ success: boolean; data?: boolean }>
  markFirstRunCompleted: () => Promise<{ success: boolean }>
  installDependency: (component: 'yt-dlp' | 'ffmpeg') => Promise<{
    success: boolean
    error?: string
  }>
  onDownloadProgress: (callback: (data: object) => void) => () => void
  onDownloadCompleted: (callback: (data: object) => void) => () => void
  onDownloadError: (callback: (data: object) => void) => () => void
  onClipboardLink: (callback: (url: string) => void) => () => void
  onDetectProgress: (
    callback: (progress: import('@shared/types/download').TrackDetectProgress) => void
  ) => () => void
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}

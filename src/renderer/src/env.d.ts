/// <reference types="vite/client" />

interface Window {
  api: {
    // Window Management
    minimizeWindow: () => void
    maximizeWindow: () => void
    closeWindow: () => void

    // Other API methods already present
    fetchMetadata: (
      url: string,
      cookiesFromBrowser?: string
    ) => Promise<{
      success: boolean
      data?: import('@shared/types/download').VideoMetadata
      error?: string
    }>
    startDownload: (
      url: string,
      options: import('@shared/types/download').DownloadOptions
    ) => Promise<{ success: boolean; data?: string; error?: string }>
    cancelDownload: (jobId: string) => Promise<{ success: boolean; error?: string }>
    resumeDownload: (jobId: string) => Promise<{ success: boolean; error?: string }>
    checkAndUpdateBinaries: () => Promise<{ success: boolean; data?: string; error?: string }>
    getBinaryStatus: () => Promise<{
      success: boolean
      data?: { ytdlp: boolean; ytdlpVersion?: string; ffmpeg: boolean; ffmpegVersion?: string }
      error?: string
    }>
    getSettings: () => Promise<{
      success: boolean
      data?: import('@shared/types/download').AppConfig
      error?: string
    }>
    setSettings: (
      settings: Partial<import('@shared/types/download').AppConfig>
    ) => Promise<{ success: boolean; error?: string }>
    toggleClipboard: (enabled: boolean) => Promise<{ success: boolean; error?: string }>
    openFolderDialog: () => Promise<{ success: boolean; data?: string; error?: string }>
    openImageDialog: () => Promise<{ success: boolean; data?: string; error?: string }>

    // Events
    onDownloadProgress: (callback: (data: any) => void) => () => void
    onDownloadCompleted: (callback: (data: any) => void) => () => void
    onDownloadError: (callback: (data: any) => void) => () => void
    onClipboardLink: (callback: (url: string) => void) => () => void

    // Utilities
    showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>
    generateId: () => string
    pathExists: (dirPath: string) => Promise<boolean>
    sanitizeName: (name: string) => Promise<string>
  }
}

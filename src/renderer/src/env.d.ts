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
      cookiesFromBrowser?: string,
      cookiesManual?: string,
      cookiesFilePath?: string
    ) => Promise<{
      success: boolean
      data?: import('@shared/types/download').VideoMetadata
      error?: string
    }>
    startDownload: (
      url: string,
      options: import('@shared/types/download').DownloadOptions,
      playlistProgress?: import('@shared/types/download').PlaylistProgress,
      metadata?: import('@shared/types/download').VideoMetadata
    ) => Promise<{ success: boolean; data?: string; error?: string }>
    cancelDownload: (jobId: string) => Promise<{ success: boolean; error?: string }>
    resumeDownload: (jobId: string) => Promise<{ success: boolean; error?: string }>
    checkAndUpdateBinaries: () => Promise<{ success: boolean; data?: string; error?: string }>
    getBinaryStatus: () => Promise<{
      success: boolean
      data?: import('@shared/types/download').BinaryStatus
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
    openFolderDialog: (
      defaultPath?: string
    ) => Promise<{ success: boolean; data?: string; error?: string }>
    openImageDialog: () => Promise<{ success: boolean; data?: string; error?: string }>
    openTxtFileDialog: () => Promise<{ success: boolean; data?: string; error?: string }>

    // Events
    onDownloadProgress: (callback: (data: unknown) => void) => () => void
    onDownloadCompleted: (callback: (data: unknown) => void) => () => void
    onDownloadError: (callback: (data: unknown) => void) => () => void
    onClipboardLink: (callback: (url: string) => void) => () => void

    // Utilities
    showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>
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
    onDetectProgress: (
      callback: (progress: import('@shared/types/download').TrackDetectProgress) => void
    ) => () => void
    onBinaryProgress: (
      callback: (progress: import('@shared/types/download').BinaryUpdateProgress) => void
    ) => () => void
  }
}

declare const __APP_VERSION__: string

export type DownloadStatus =
  | 'idle'
  | 'fetching_meta'
  | 'pending'
  | 'starting'
  | 'downloading'
  | 'converting'
  | 'done'
  | 'error'
  | 'cancelled'
  | 'paused'
export type MediaFormat = 'audio' | 'video' | 'audio+video'

export type AudioQuality =
  | 'best'
  | 'flac'
  | '320k'
  | '256k'
  | '192k'
  | '128k'
  | '96k'
  | 'opus'
  | 'aac'
export type VideoQuality =
  | 'best'
  | '4320p'
  | '2160p'
  | '1440p'
  | '1080p'
  | '720p'
  | '480p'
  | '360p'
  | '240p'
  | '144p'

export interface ChapterInfo {
  id: string
  title: string
  startTime: number
  endTime: number
  selected: boolean
}

export interface PlaylistItem {
  id: string
  title: string
  url: string
  duration: number
  thumbnail: string
  selected: boolean
}

export interface VideoMetadata {
  id: string
  title: string
  author: string
  duration: number // seconds
  thumbnail: string
  url: string
  isPlaylist: boolean
  playlistItems?: PlaylistItem[]
  chapters?: ChapterInfo[]
  availableFormats: string[]
  originalAudioBitrate?: number // kbps
  description?: string
  uploadDate?: string
}

export interface DownloadOptions {
  format: MediaFormat
  audioQuality: AudioQuality
  videoQuality: VideoQuality
  outputPath: string
  // Subtitles
  downloadSubtitles: boolean
  embedSubtitles: boolean
  subtitleLanguage: string
  // Metadata
  embedThumbnail: boolean
  embedMetadata: boolean
  cookiesFromBrowser?: string
  selectedChapters?: string[]
  // Playlist
  playlistAll: boolean
  selectedPlaylistItems?: string[]
  // Timing
  timeFrom?: string // HH:MM:SS
  timeTo?: string // HH:MM:SS
  // Advanced
  customArgs?: string
  customTitle?: string
  customThumbnail?: string // local path to image file
  customArtist?: string
  customYear?: string
  customDescription?: string
  expectedDuration?: number
}

export interface DownloadJob {
  id: string
  url: string
  metadata?: VideoMetadata
  options: DownloadOptions
  status: DownloadStatus
  progress: number // 0-100
  speed?: string // e.g. "5.2 MiB/s"
  eta?: string // e.g. "00:23"
  size?: string // e.g. "128.3 MiB"
  outputPath?: string
  finalFilePath?: string
  error?: string
  createdAt: number
}

export interface Preset {
  id: string
  name: string
  emoji: string
  options: Partial<DownloadOptions>
}

export interface AppConfig {
  outputDirectoryVideo: string
  outputDirectoryAudio: string
  concurrentDownloads: number // 1-5
  // Subtitles defaults
  downloadSubtitles: boolean
  embedSubtitles: boolean
  subtitleLanguage: string
  // Metadata defaults
  embedThumbnail: boolean
  embedMetadata: boolean
  cookiesFromBrowser: string
  // Features
  clipboardWatcher: boolean
  portableMode: boolean
  customArgs: string
  // Appearance
  language: 'en' | 'ru'
  theme:
    | 'deep-space'
    | 'light'
    | 'midnight-purple'
    | 'crimson-wave'
    | 'arctic-steel'
    | 'sunset-amber'
    | 'graphite-pro'
    | 'sakura-rain'
    | 'forest-terminal'
    | 'system'
  // Presets
  presets: Preset[]
  // Last used
  lastFormat: MediaFormat
  lastAudioQuality: AudioQuality
  lastVideoQuality: VideoQuality
}

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'car',
    name: 'В машину',
    emoji: '🚗',
    options: { format: 'audio', audioQuality: '320k', embedThumbnail: true, embedMetadata: true }
  },
  {
    id: 'mobile',
    name: 'На телефон',
    emoji: '📱',
    options: { format: 'video', videoQuality: '720p' }
  },
  {
    id: 'archive',
    name: 'Архив 4K',
    emoji: '📺',
    options: { format: 'audio+video', videoQuality: '2160p' }
  }
]

export const DEFAULT_CONFIG: AppConfig = {
  outputDirectoryVideo: '',
  outputDirectoryAudio: '',
  concurrentDownloads: 2,
  downloadSubtitles: false,
  embedSubtitles: false,
  subtitleLanguage: 'ru',
  embedThumbnail: true,
  embedMetadata: true,
  cookiesFromBrowser: '',
  clipboardWatcher: true,
  portableMode: false,
  customArgs: '',
  language: 'en',
  theme: 'system',
  presets: DEFAULT_PRESETS,
  lastFormat: 'audio+video',
  lastAudioQuality: 'best',
  lastVideoQuality: 'best'
}

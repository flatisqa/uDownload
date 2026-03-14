import { StateCreator } from 'zustand'
import type {
  VideoMetadata,
  MediaFormat,
  AudioQuality,
  VideoQuality
} from '@shared/types/download'

export type DownloadStep = 'idle' | 'fetching' | 'preview' | 'downloading'

export interface DownloaderSlice {
  // State
  url: string
  step: DownloadStep
  meta: VideoMetadata | null
  error: string
  format: MediaFormat
  audioQuality: AudioQuality
  videoQuality: VideoQuality
  selectedPlaylistItems: string[]
  selectedChapters: string[]
  timeFrom: string
  timeTo: string
  customTitle: string
  customThumbnail: string
  customArtist: string
  customYear: string
  customDescription: string

  // Actions
  setUrl: (url: string) => void
  setStep: (step: DownloadStep) => void
  setMeta: (meta: VideoMetadata | null) => void
  setError: (error: string) => void
  setFormat: (format: MediaFormat) => void
  setAudioQuality: (q: AudioQuality) => void
  setVideoQuality: (q: VideoQuality) => void
  setSelectedPlaylistItems: (items: string[]) => void
  setSelectedChapters: (chapters: string[]) => void
  setTimeFrom: (t: string) => void
  setTimeTo: (t: string) => void
  setCustomTitle: (title: string) => void
  setCustomThumbnail: (path: string) => void
  setCustomArtist: (artist: string) => void
  setCustomYear: (year: string) => void
  setCustomDescription: (desc: string) => void
  resetDownloader: () => void
}

export const createDownloaderSlice: StateCreator<DownloaderSlice> = (set) => ({
  url: '',
  step: 'idle',
  meta: null,
  error: '',
  format: 'audio+video',
  audioQuality: 'best',
  videoQuality: 'best',
  selectedPlaylistItems: [],
  selectedChapters: [],
  timeFrom: '',
  timeTo: '',
  customTitle: '',
  customThumbnail: '',
  customArtist: '',
  customYear: '',
  customDescription: '',

  setUrl: (url) => set({ url }),
  setStep: (step) => set({ step }),
  setMeta: (meta) => set({ meta }),
  setError: (error) => set({ error }),
  setFormat: (format) => set({ format }),
  setAudioQuality: (audioQuality) => set({ audioQuality }),
  setVideoQuality: (videoQuality) => set({ videoQuality }),
  setSelectedPlaylistItems: (selectedPlaylistItems) => set({ selectedPlaylistItems }),
  setSelectedChapters: (selectedChapters) => set({ selectedChapters }),
  setTimeFrom: (timeFrom) => set({ timeFrom }),
  setTimeTo: (timeTo) => set({ timeTo }),
  setCustomTitle: (customTitle) => set({ customTitle }),
  setCustomThumbnail: (customThumbnail) => set({ customThumbnail }),
  setCustomArtist: (customArtist) => set({ customArtist }),
  setCustomYear: (customYear) => set({ customYear }),
  setCustomDescription: (customDescription) => set({ customDescription }),
  
  resetDownloader: () => set({
    url: '',
    step: 'idle',
    meta: null,
    error: '',
    selectedPlaylistItems: [],
    selectedChapters: [],
    timeFrom: '',
    timeTo: '',
    customTitle: '',
    customThumbnail: '',
    customArtist: '',
    customYear: '',
    customDescription: ''
    // Intentionally keep format/quality preferences intact
  })
})

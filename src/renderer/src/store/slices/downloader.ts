import { StateCreator } from 'zustand'
import type {
  VideoMetadata,
  MediaFormat,
  AudioQuality,
  VideoQuality,
  DetectedTrack
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
  chapterMode: 'single' | 'selected'
  customTitle: string
  customThumbnail: string
  customArtist: string
  customYear: string
  customDescription: string
  detectedTracks: DetectedTrack[]

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
  setChapterMode: (mode: 'single' | 'selected') => void
  setCustomTitle: (title: string) => void
  setCustomThumbnail: (path: string) => void
  setCustomArtist: (artist: string) => void
  setCustomYear: (year: string) => void
  setCustomDescription: (desc: string) => void
  setDetectedTracks: (tracks: DetectedTrack[]) => void
  toggleDetectedTrack: (id: string) => void
  toggleAllDetectedTracks: (selected: boolean) => void
  updateDetectedTrackTitle: (id: string, title: string) => void
  mergeDetectedTrackWithPrevious: (id: string) => void
  mergeDetectedTrackWithNext: (id: string) => void
  deleteDetectedTrack: (id: string) => void
  resetDownloader: () => void
}

function renumberTracks(tracks: DetectedTrack[]): DetectedTrack[] {
  return tracks.map((t, idx) => {
    const num = String(idx + 1).padStart(2, '0')
    let title = t.title
    if (/^Трек\s+\d+$/i.test(title)) {
      title = `Трек ${num}`
    } else if (/^\d+[\s\-–—.:)]+/.test(title)) {
      title = title.replace(/^\d+[\s\-–—.:)]+/, `${num}. `)
    }
    return {
      ...t,
      id: `track-${idx + 1}`,
      title
    }
  })
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
  chapterMode: 'single',
  customTitle: '',
  customThumbnail: '',
  customArtist: '',
  customYear: '',
  customDescription: '',
  detectedTracks: [],

  setUrl: (url) => set({ url }),
  setStep: (step) => set({ step }),
  setMeta: (meta) => set({ meta }),
  setError: (error) => set({ error }),
  setFormat: (format) => set({ format }),
  setAudioQuality: (audioQuality) => set({ audioQuality }),
  setVideoQuality: (videoQuality) => set({ videoQuality }),
  setSelectedPlaylistItems: (selectedPlaylistItems) => set({ selectedPlaylistItems }),
  setSelectedChapters: (selectedChapters) => set({ selectedChapters }),
  setChapterMode: (chapterMode) => set({ chapterMode }),
  setTimeFrom: (timeFrom) => set({ timeFrom }),
  setTimeTo: (timeTo) => set({ timeTo }),
  setCustomTitle: (customTitle) => set({ customTitle }),
  setCustomThumbnail: (customThumbnail) => set({ customThumbnail }),
  setCustomArtist: (customArtist) => set({ customArtist }),
  setCustomYear: (customYear) => set({ customYear }),
  setCustomDescription: (customDescription) => set({ customDescription }),
  setDetectedTracks: (detectedTracks) => set({ detectedTracks }),
  toggleDetectedTrack: (id) =>
    set((state) => ({
      detectedTracks: state.detectedTracks.map((t) =>
        t.id === id ? { ...t, selected: !t.selected } : t
      )
    })),
  toggleAllDetectedTracks: (selected) =>
    set((state) => ({
      detectedTracks: state.detectedTracks.map((t) => ({ ...t, selected }))
    })),
  updateDetectedTrackTitle: (id, title) =>
    set((state) => ({
      detectedTracks: state.detectedTracks.map((t) => (t.id === id ? { ...t, title } : t))
    })),
  mergeDetectedTrackWithPrevious: (id) =>
    set((state) => {
      const idx = state.detectedTracks.findIndex((t) => t.id === id)
      if (idx <= 0) return state
      const tracks = [...state.detectedTracks]
      const prev = { ...tracks[idx - 1] }
      const curr = tracks[idx]
      prev.endTime = curr.endTime
      prev.duration = Math.max(1, Math.round(prev.endTime - prev.startTime))
      tracks[idx - 1] = prev
      tracks.splice(idx, 1)
      return { detectedTracks: renumberTracks(tracks) }
    }),
  mergeDetectedTrackWithNext: (id) =>
    set((state) => {
      const idx = state.detectedTracks.findIndex((t) => t.id === id)
      if (idx < 0 || idx >= state.detectedTracks.length - 1) return state
      const tracks = [...state.detectedTracks]
      const curr = tracks[idx]
      const next = { ...tracks[idx + 1] }
      next.startTime = curr.startTime
      next.duration = Math.max(1, Math.round(next.endTime - next.startTime))
      tracks[idx + 1] = next
      tracks.splice(idx, 1)
      return { detectedTracks: renumberTracks(tracks) }
    }),
  deleteDetectedTrack: (id) =>
    set((state) => ({
      detectedTracks: renumberTracks(state.detectedTracks.filter((t) => t.id !== id))
    })),

  resetDownloader: () =>
    set({
      url: '',
      step: 'idle',
      meta: null,
      error: '',
      selectedPlaylistItems: [],
      selectedChapters: [],
      timeFrom: '',
      timeTo: '',
      chapterMode: 'single',
      customTitle: '',
      customThumbnail: '',
      customArtist: '',
      customYear: '',
      customDescription: '',
      detectedTracks: []
      // Intentionally keep format/quality preferences intact
    })
})

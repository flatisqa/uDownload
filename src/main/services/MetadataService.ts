import { execFile } from 'child_process'
import { promisify } from 'util'
import { getYtdlpBin } from './BinaryManager'
import type { VideoMetadata, ChapterInfo, PlaylistItem } from '@shared/types/download'

const execFileAsync = promisify(execFile)

interface RawChapter {
  id?: number
  title: string
  start_time: number
  end_time: number
}

interface RawEntry {
  id: string
  title: string
  webpage_url: string
  duration?: number
  thumbnail?: string
}

interface RawYtdlpInfo {
  id: string
  title: string
  uploader?: string
  channel?: string
  duration?: number
  thumbnail?: string
  webpage_url: string
  _type?: string
  entries?: RawEntry[]
  chapters?: RawChapter[]
  formats?: Array<{ ext: string; vcodec?: string; acodec?: string }>
}

export async function fetchMetadata(
  url: string,
  cookiesFromBrowser?: string
): Promise<VideoMetadata> {
  const bin = getYtdlpBin()

  const args = [
    '--dump-json',
    '--no-playlist', // try single first; will retry with playlist logic
    '--flat-playlist' // for playlists: fast, only get entries info
  ]

  if (cookiesFromBrowser) {
    args.push('--cookies-from-browser', cookiesFromBrowser)
  }

  args.push(url)

  const { stdout } = await execFileAsync(bin, args)

  // yt-dlp may return multiple JSON lines for playlists
  const lines = stdout.trim().split('\n').filter(Boolean)
  const first: RawYtdlpInfo = JSON.parse(lines[0])

  const isPlaylist = first._type === 'playlist' || lines.length > 1

  let playlistItems: PlaylistItem[] | undefined
  if (isPlaylist && first.entries) {
    playlistItems = first.entries.map(
      (e, i): PlaylistItem => ({
        id: e.id || String(i),
        title: e.title,
        url: e.webpage_url,
        duration: e.duration || 0,
        thumbnail: e.thumbnail || '',
        selected: true
      })
    )
  }

  const chapters: ChapterInfo[] | undefined = first.chapters?.map(
    (c, i): ChapterInfo => ({
      id: String(i),
      title: c.title,
      startTime: c.start_time,
      endTime: c.end_time,
      selected: false
    })
  )

  // Collect available formats
  const formatsSet = new Set<string>()
  if (first.formats) {
    for (const f of first.formats) {
      if (f.ext) formatsSet.add(f.ext)
    }
  }

  return {
    id: first.id,
    title: first.title,
    author: first.uploader || first.channel || 'Unknown',
    duration: first.duration || 0,
    thumbnail: first.thumbnail || '',
    url: first.webpage_url || url,
    isPlaylist,
    playlistItems,
    chapters,
    availableFormats: Array.from(formatsSet)
  }
}

export function buildYtdlpArgs(options: {
  format: string
  audioQuality: string
  videoQuality: string
  outputPath: string
  outputTemplate: string
  downloadSubtitles: boolean
  embedSubtitles: boolean
  subtitleLanguage: string
  embedThumbnail: boolean
  embedMetadata: boolean
  cookiesFromBrowser?: string
  splitByChapters: boolean
  selectedChapters?: string[]
  selectedPlaylistItems?: string[]
  timeFrom?: string
  timeTo?: string
  customArgs?: string
  ffmpegBin: string
}): string[] {
  const args: string[] = []

  // Ensure progress is emitted line-by-line instead of \r
  args.push('--newline')

  // FFmpeg location - only pass if it looks like a path (has slash or backslash)
  if (options.ffmpegBin.includes('/') || options.ffmpegBin.includes('\\')) {
    args.push('--ffmpeg-location', options.ffmpegBin)
  }

  // Output template
  args.push('-o', options.outputTemplate)

  // Format selection
  if (options.format === 'audio') {
    args.push('-x', '--audio-format', 'mp3')
    if (options.audioQuality !== 'best') {
      args.push('--audio-quality', options.audioQuality.replace('k', ''))
    }
  } else if (options.format === 'video') {
    const height = options.videoQuality !== 'best' ? options.videoQuality.replace('p', '') : null
    if (height) {
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`)
    } else {
      args.push('-f', 'bestvideo+bestaudio/best')
    }
    args.push('--merge-output-format', 'mp4')
  } else {
    // audio+video
    const height = options.videoQuality !== 'best' ? options.videoQuality.replace('p', '') : null
    if (height) {
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`)
    } else {
      args.push('-f', 'bestvideo+bestaudio/best')
    }
    args.push('--merge-output-format', 'mkv')
  }

  // Subtitles
  if (options.downloadSubtitles) {
    args.push('--write-subs', '--write-auto-subs', '--sub-lang', options.subtitleLanguage)
    if (options.embedSubtitles) {
      args.push('--embed-subs')
    }
  }

  // Metadata / Thumbnail
  if (options.embedThumbnail) args.push('--embed-thumbnail')
  if (options.embedMetadata) args.push('--embed-metadata')
  if (options.cookiesFromBrowser) args.push('--cookies-from-browser', options.cookiesFromBrowser)

  // Playlist Items
  if (options.selectedPlaylistItems && options.selectedPlaylistItems.length > 0) {
    args.push('--playlist-items', options.selectedPlaylistItems.join(','))
  }

  // Chapters & Timing
  let hasCuts = false
  if (options.splitByChapters) {
    args.push('--split-chapters')
    hasCuts = true
  } else if (options.selectedChapters && options.selectedChapters.length > 0) {
    hasCuts = true
    for (const chapter of options.selectedChapters) {
      if (chapter.includes('-')) {
        args.push('--download-sections', `*${chapter}`)
      } else {
        // Fallback for titles: regex escape
        args.push('--download-sections', `*${chapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
      }
    }
  } else if (options.timeFrom || options.timeTo) {
    hasCuts = true
    const section = [options.timeFrom || '0:00', '-', options.timeTo || 'inf'].join('')
    args.push('--download-sections', `*${section}`)
  }

  if (hasCuts) {
    args.push('--force-keyframes-at-cuts')
  }

  // Custom args (advanced)
  if (options.customArgs) {
    args.push(...options.customArgs.split(' ').filter(Boolean))
  }

  return args
}

import { execFile } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as os from 'os'
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
  formats?: Array<{ ext: string; vcodec?: string; acodec?: string; abr?: number; tbr?: number }>
  description?: string
  upload_date?: string
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

  // Collect available formats and extract max audio bitrate
  const formatsSet = new Set<string>()
  let maxAbr = 0

  if (first.formats) {
    for (const f of first.formats) {
      if (f.ext) formatsSet.add(f.ext)
      // Check audio bitrate directly
      if (f.abr && f.abr > maxAbr) {
        maxAbr = f.abr
      }
      // Or use total bitrate if it's an audio-only format
      else if (f.vcodec === 'none' && f.tbr && f.tbr > maxAbr) {
        maxAbr = f.tbr
      }
    }
  }

  console.log('[DEBUG] First format audio extraction:', {
    maxAbr,
    countFormats: first.formats?.length,
    audioFormatsExample: first.formats?.filter((f) => f.acodec !== 'none').slice(0, 3)
  })

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
    availableFormats: Array.from(formatsSet),
    originalAudioBitrate: maxAbr > 0 ? Math.round(maxAbr) : undefined,
    description: first.description,
    uploadDate: first.upload_date
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
  selectedChapters?: string[]
  selectedPlaylistItems?: string[]
  timeFrom?: string
  timeTo?: string
  customArgs?: string
  ffmpegBin: string
  customTitle?: string
  customThumbnail?: string
  customArtist?: string
  customYear?: string
  customDescription?: string
}): string[] {
  const args: string[] = []

  // Ensure progress is emitted line-by-line instead of \r
  args.push('--newline')

  // FFmpeg location - only pass if it looks like a path (has slash or backslash)
  if (options.ffmpegBin.includes('/') || options.ffmpegBin.includes('\\')) {
    args.push('--ffmpeg-location', options.ffmpegBin)
  }

  // Output template handling
  let outputPath = options.outputPath
  if (!outputPath) {
    if (options.format === 'audio') {
      outputPath = path.join(os.homedir(), 'Music')
    } else {
      outputPath = path.join(os.homedir(), 'Videos')
    }
  }

  // Determine if chapters are being processed (either split all or manual selection)
  const selectedChaptersCount = options.selectedChapters ? options.selectedChapters.length : 0

  // Chapter processing logic
  const hasMultipleChapters = selectedChaptersCount > 1
  const isSingleChapter = selectedChaptersCount === 1

  // Use custom title for file name if provided, otherwise yt-dlp title
  const titleTemplate = options.customTitle
    ? options.customTitle.replace(/[\\/:*?"<>|]/g, '_')
    : '%(title)s'

  if (hasMultipleChapters && options.format === 'audio') {
    // Construct the subfolder path named after the video
    const chapterOutputDir = path.join(outputPath, titleTemplate)
    const chapterTemplate = path.join(
      chapterOutputDir,
      '%(section_number)03d - %(section_title)s.%(ext)s'
    )

    // Always use chapter: prefix for anything related to chapters (split all or manual selection)
    // and default: for the main video file.
    const outputTemplate = path.join(outputPath, `${titleTemplate}.%(ext)s`)
    args.push('-o', `default:${outputTemplate}`)
    args.push('-o', `chapter:${chapterTemplate}`)
  } else if (isSingleChapter && options.format === 'audio') {
    // For a single chapter, save it directly to the output path
    // Format: "Video Title - Chapter Title.mp3"
    const chapterTemplate = path.join(outputPath, `${titleTemplate} - %(section_title)s.%(ext)s`)
    const outputTemplate = path.join(outputPath, `${titleTemplate}.%(ext)s`)
    args.push('-o', `default:${outputTemplate}`)
    args.push('-o', `chapter:${chapterTemplate}`)
  } else {
    const outputTemplate = path.join(outputPath, `${titleTemplate}.%(ext)s`)
    args.push('-o', outputTemplate)
  }

  // Format selection
  if (options.format === 'audio') {
    const q = options.audioQuality
    if (q === 'best') {
      // Use opus explicitly to avoid mutagen dependency for WebM metadata embedding
      // Opus IS the native YouTube format - no quality loss, FFmpeg handles metadata
      args.push('-x', '--audio-format', 'opus')
    } else if (q === 'flac') {
      args.push('-x', '--audio-format', 'flac')
    } else if (q === 'opus') {
      args.push('-x', '--audio-format', 'opus')
    } else if (q === 'aac') {
      args.push('-x', '--audio-format', 'aac')
    } else {
      // MP3 bitrates: 96k, 128k, 192k, 256k, 320k
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', q.replace('k', ''))
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

  // Check if format requires mutagen for embedding metadata/thumbnails
  const requiresMutagen =
    options.format === 'audio' &&
    (options.audioQuality === 'best' ||
      options.audioQuality === 'flac' ||
      options.audioQuality === 'opus' ||
      options.audioQuality === 'ogg')

  // Subtitles
  if (options.downloadSubtitles) {
    args.push('--write-subs', '--write-auto-subs', '--sub-lang', options.subtitleLanguage)
    if (options.embedSubtitles) {
      args.push('--embed-subs')
    }
  }

  // Metadata / Thumbnail
  const canEmbed = !requiresMutagen

  if (canEmbed) {
    if (options.customThumbnail) {
      // If custom thumbnail is provided, we use it
      args.push('--thumbnail-output', options.customThumbnail)
      args.push('--embed-thumbnail')
    } else if (options.embedThumbnail) {
      args.push('--embed-thumbnail')
    }

    if (options.embedMetadata) args.push('--embed-metadata')
  }

  // We use a hybrid strategy:
  // 1. --replace-in-metadata for raw text fields (handles () signs better than regex)
  // 2. --parse-metadata for date fields (avoids "unconverted data" error in some yt-dlp versions)
  // 3. Clear webpage_url if custom description is provided (prevents automatic URL injection into Comment tag)
  if (options.customTitle) {
    args.push('--replace-in-metadata', 'title', '(?s)^.*$', options.customTitle)
  }
  if (options.customArtist) {
    args.push('--replace-in-metadata', 'artist', '(?s)^.*$', options.customArtist)
    args.push('--replace-in-metadata', 'uploader', '(?s)^.*$', options.customArtist)
    args.push('--replace-in-metadata', 'creator', '(?s)^.*$', options.customArtist)
  }
  if (options.customYear) {
    const yearStr = options.customYear.trim()
    const paddedYear = /^\d{4}$/.test(yearStr) ? `${yearStr}0101` : yearStr
    args.push('--parse-metadata', `:(?P<upload_date>${paddedYear})`)
    args.push('--parse-metadata', `:(?P<date>${paddedYear})`)
  }
  if (options.customDescription) {
    // Inject the custom comment into potential URL sources because yt-dlp maps
    // webpage_url natively to the ID3 "Comment" and "purl" tags for MP3s.
    args.push('--replace-in-metadata', 'webpage_url', '(?s)^.*$', options.customDescription)
    args.push('--replace-in-metadata', 'url', '(?s)^.*$', options.customDescription)
    args.push('--replace-in-metadata', 'original_url', '(?s)^.*$', options.customDescription)

    // Set custom description in all possible comment/desc fields
    args.push('--replace-in-metadata', 'description', '(?s)^.*$', options.customDescription)
    args.push('--replace-in-metadata', 'comment', '(?s)^.*$', options.customDescription)
    args.push('--replace-in-metadata', 'synopsis', '(?s)^.*$', options.customDescription)
    args.push('--replace-in-metadata', 'album', '(?s)^.*$', options.customDescription)
  }
  if (options.cookiesFromBrowser) args.push('--cookies-from-browser', options.cookiesFromBrowser)

  if (options.embedMetadata) args.push('--embed-metadata')

  // Playlist Items
  if (options.selectedPlaylistItems && options.selectedPlaylistItems.length > 0) {
    args.push('--playlist-items', options.selectedPlaylistItems.join(','))
  }

  // Chapters & Timing
  let hasCuts = false
  if (options.selectedChapters && options.selectedChapters.length > 0) {
    hasCuts = true
    for (const chapter of options.selectedChapters) {
      if (/^[\d:.]+-[\d:.inf]+$/.test(chapter)) {
        args.push('--download-sections', `*${chapter}`)
      } else {
        args.push('--download-sections', `^${chapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
      }
    }
  } else if (options.timeFrom || options.timeTo) {
    hasCuts = true
    const section = [options.timeFrom || '0:00', '-', options.timeTo || 'inf'].join('')
    args.push('--download-sections', `*${section}`)
  }

  // Determine output template.
  // We use simpler logic now since DownloaderPage handles folder creation.
  // (Variables selectedChaptersCount and isSingleChapter are already defined above)

  if (isSingleChapter && options.format === 'audio') {
    // If we have a custom title from UI (which includes chapter title), use it directly
    const chapterTemplate = options.customTitle
      ? path.join(outputPath, `${titleTemplate}.%(ext)s`)
      : path.join(outputPath, `${titleTemplate} - %(section_title)s.%(ext)s`)
    args.push('-o', chapterTemplate)
  } else if (selectedChaptersCount > 1 && options.format === 'audio') {
    // When multiple chapters are sent (though now we send them 1-by-1 usually),
    // we use section numbering.
    const chapterTemplate = path.join(
      outputPath,
      '%(section_number)03d - %(section_title)s.%(ext)s'
    )
    args.push('-o', chapterTemplate)
  } else {
    const outputTemplate = path.join(outputPath, `${titleTemplate}.%(ext)s`)
    args.push('-o', outputTemplate)
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

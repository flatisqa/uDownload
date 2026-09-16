import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import { getYtdlpBin, getFfmpegBin } from './BinaryManager'
import type {
  DetectedTrack,
  SilenceDetectOptions,
  TrackDetectProgress
} from '@shared/types/download'

let activeYtdlpProc: ChildProcess | null = null
let activeFfmpegProc: ChildProcess | null = null

export function cancelActiveDetection(): void {
  if (activeYtdlpProc && !activeYtdlpProc.killed) {
    try {
      activeYtdlpProc.kill('SIGKILL')
    } catch {
      // Ignore if already terminated
    }
  }
  if (activeFfmpegProc && !activeFfmpegProc.killed) {
    try {
      activeFfmpegProc.kill('SIGKILL')
    } catch {
      // Ignore if already terminated
    }
  }
  activeYtdlpProc = null
  activeFfmpegProc = null
}

export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr
    .trim()
    .split(':')
    .map((p) => parseFloat(p))
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return parts[0] || 0
}

export function formatSecondsToDisplay(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Detect silence intervals in an audio stream using FFmpeg silencedetect.
 * Uses piping from yt-dlp to FFmpeg stdin to preserve cookies and avoid HTTP 403 Forbidden.
 */
export async function detectSilenceTracks(
  url: string,
  totalDuration: number,
  cookies?: {
    cookiesFromBrowser?: string
    cookiesManual?: string
    cookiesFilePath?: string
  },
  options: SilenceDetectOptions = {},
  onProgress?: (progress: TrackDetectProgress) => void
): Promise<DetectedTrack[]> {
  cancelActiveDetection()

  const ytdlpBin = getYtdlpBin()
  const ffmpegBin = getFfmpegBin()

  // 1. Prepare yt-dlp args to stream directly to stdout
  const ytdlpArgs = ['-o', '-', '-f', '18/ba/b', url]
  if (cookies?.cookiesFilePath && fs.existsSync(cookies.cookiesFilePath)) {
    ytdlpArgs.push('--cookies', cookies.cookiesFilePath)
  } else if (cookies?.cookiesFromBrowser) {
    ytdlpArgs.push('--cookies-from-browser', cookies.cookiesFromBrowser)
  }

  // 2. Prepare FFmpeg args to read from stdin (pipe:0)
  const noise = options.noiseLevel ?? -32
  const minSilence = options.minSilenceDuration ?? 1.5
  const minTrackDuration = options.minTrackDuration ?? 30

  const ffmpegArgs = [
    '-i',
    'pipe:0',
    '-vn',
    '-af',
    `silencedetect=noise=${noise}dB:d=${minSilence}`,
    '-f',
    'null',
    '-'
  ]

  const ytdlpProc = spawn(ytdlpBin, ytdlpArgs)
  const ffmpegProc = spawn(ffmpegBin, ffmpegArgs)

  activeYtdlpProc = ytdlpProc
  activeFfmpegProc = ffmpegProc

  let stderr = ''
  let ytdlpError = ''
  let wasCancelled = false

  ytdlpProc.stderr.on('data', (chunk) => {
    ytdlpError += chunk.toString()
  })

  ffmpegProc.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    stderr += text

    if (onProgress) {
      const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/)
      const speedMatch = text.match(/speed=\s*([\d.]+x)/)
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10)
        const mins = parseInt(timeMatch[2], 10)
        const secs = parseFloat(timeMatch[3])
        const currentTime = Math.round(hours * 3600 + mins * 60 + secs)
        const percent =
          totalDuration > 0 ? Math.min(99, Math.round((currentTime / totalDuration) * 100)) : 0
        const speed = speedMatch ? speedMatch[1] : undefined
        onProgress({ percent, currentTime, totalDuration, speed })
      }
    }
  })

  ytdlpProc.stdout.pipe(ffmpegProc.stdin)

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false

      const done = (err?: Error): void => {
        if (settled) return
        settled = true
        if (err) reject(err)
        else resolve()
      }

      ytdlpProc.on('error', (err) => {
        if (!wasCancelled) done(new Error(`Не удалось запустить yt-dlp: ${err.message}`))
      })

      ffmpegProc.on('error', (err) => {
        if (!wasCancelled) done(new Error(`Не удалось запустить FFmpeg: ${err.message}`))
      })

      ytdlpProc.on('close', (code, signal) => {
        if (signal === 'SIGKILL') wasCancelled = true
        if (code !== 0 && !stderr.includes('silencedetect') && !wasCancelled) {
          done(new Error(`Ошибка yt-dlp: ${ytdlpError || 'код ' + code}`))
        }
      })

      ffmpegProc.on('close', (code, signal) => {
        if (signal === 'SIGKILL') wasCancelled = true
        if (wasCancelled) {
          done(new Error('Сканирование отменено'))
        } else if (code === 0 || stderr.includes('silencedetect')) {
          done()
        } else {
          done(new Error(`Ошибка работы FFmpeg: ${stderr || ytdlpError || 'код ' + code}`))
        }
      })
    })
  } finally {
    activeYtdlpProc = null
    activeFfmpegProc = null
  }

  // 3. Parse silence points
  const rawSilences: Array<{ start: number; end: number }> = []
  let currentStart: number | null = null

  const lines = stderr.split('\n')
  for (const line of lines) {
    const startMatch = line.match(/silence_start:\s*([0-9.]+)/)
    if (startMatch) {
      currentStart = parseFloat(startMatch[1])
    }
    const endMatch = line.match(/silence_end:\s*([0-9.]+)/)
    if (endMatch) {
      const end = parseFloat(endMatch[1])
      const start = currentStart !== null ? currentStart : Math.max(0, end - minSilence)
      rawSilences.push({ start, end })
      currentStart = null
    }
  }

  // 4. Construct track boundaries
  // Filter out leading silence if within first 10 seconds
  let effectiveStart = 0
  const filteredSilences: Array<{ start: number; end: number }> = []

  for (const s of rawSilences) {
    if (s.start < 10 && effectiveStart === 0) {
      effectiveStart = s.end
      continue
    }
    // Filter out trailing silence near end of video
    if (totalDuration > 0 && s.start > totalDuration - 10) {
      continue
    }
    filteredSilences.push(s)
  }

  const cutPoints: Array<{ startTime: number; endTime: number }> = []
  let trackStart = effectiveStart

  for (const s of filteredSilences) {
    const trackEnd = s.start
    if (trackEnd - trackStart >= minTrackDuration) {
      cutPoints.push({ startTime: trackStart, endTime: trackEnd })
      trackStart = s.end
    }
  }

  // Final track to the end of the audio
  const finalEnd = totalDuration > 0 ? totalDuration : trackStart + 180
  if (finalEnd - trackStart >= minTrackDuration) {
    cutPoints.push({ startTime: trackStart, endTime: finalEnd })
  } else if (cutPoints.length > 0) {
    // Merge tiny trailing portion into the last track
    cutPoints[cutPoints.length - 1].endTime = finalEnd
  }

  // 5. Build DetectedTrack array
  const tracks: DetectedTrack[] = cutPoints.map((cp, idx) => {
    const duration = Math.round(cp.endTime - cp.startTime)
    const numStr = String(idx + 1).padStart(2, '0')
    return {
      id: `track-${idx + 1}`,
      title: `Трек ${numStr}`,
      startTime: Math.round(cp.startTime),
      endTime: Math.round(cp.endTime),
      duration,
      selected: true
    }
  })

  return tracks
}

/**
 * Parse human-written text tracklist with timestamps into DetectedTracks.
 * Example input:
 * 00:00 Intro
 * 03:45 First Song
 * 08:20 Second Song
 */
export function parseTextTracklist(text: string, totalDuration: number): DetectedTrack[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const timeRegex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/

  const rawEntries: Array<{ time: number; title: string }> = []

  for (const line of lines) {
    const match = line.match(timeRegex)
    if (match) {
      const timeStr = match[0]
      const seconds = parseTimeToSeconds(timeStr)
      // Extract title by removing the time string and common separators
      let title = line
        .replace(timeStr, '')
        .replace(/^[\s\-–—.:)\]]+|[\s\-–—.:)\]]+$/g, '')
        .trim()
      // Remove leading track numbers like "1. ", "02 - "
      title = title.replace(/^\d+[\s\-–—.:)]+/, '').trim()
      if (!title) {
        title = `Трек ${String(rawEntries.length + 1).padStart(2, '0')}`
      }
      rawEntries.push({ time: seconds, title })
    }
  }

  // Sort by time
  rawEntries.sort((a, b) => a.time - b.time)

  if (rawEntries.length === 0) {
    return []
  }

  const tracks: DetectedTrack[] = []
  for (let i = 0; i < rawEntries.length; i++) {
    const current = rawEntries[i]
    const next = rawEntries[i + 1]
    const startTime = current.time
    const endTime = next ? next.time : totalDuration > startTime ? totalDuration : startTime + 180
    const duration = Math.max(1, Math.round(endTime - startTime))
    const numStr = String(i + 1).padStart(2, '0')

    tracks.push({
      id: `manual-track-${i + 1}`,
      title: current.title || `Трек ${numStr}`,
      startTime: Math.round(startTime),
      endTime: Math.round(endTime),
      duration,
      selected: true
    })
  }

  return tracks
}

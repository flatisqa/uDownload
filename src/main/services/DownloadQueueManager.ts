import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { EventEmitter } from 'events'
import { getYtdlpBin, getFfmpegBin } from './BinaryManager'
import { buildYtdlpArgs } from './MetadataService'
import Store from 'electron-store'
import type { DownloadJob, DownloadOptions, AppConfig } from '@shared/types/download'

// [download]  45.3% of 128.30MiB at 5.20MiB/s ETA 00:12
// [download]   1.4% of ~123.4MiB at Unknown speed ETA Unknown ETA
const PROGRESS_RE = /\[download\]\s+([\d.]+)%\s+of\s+[~]?([\d.]+\S+)\s+at\s+(.*?)\s+ETA\s+(.*?)$/

type ProcessEntry = {
  process: ChildProcess
  options: DownloadOptions
  destinations: string[]
  speedHistory: number[]
  progress?: number
  phase: 'downloading' | 'converting'
}

export class DownloadQueueManager extends EventEmitter {
  private queue: DownloadJob[] = []
  private active: Map<string, ProcessEntry> = new Map()
  private store: Store<AppConfig>
  private concurrency: number

  constructor(concurrency = 2) {
    super()
    this.store = new Store<AppConfig>()
    this.concurrency = concurrency
  }

  setConcurrency(n: number): void {
    this.concurrency = n
    this.tick()
  }

  enqueue(job: DownloadJob): void {
    this.queue.push(job)
    // Delay tick to allow IPC main-renderer roundtrip to complete
    setTimeout(() => this.tick(), 50)
  }

  cancel(jobId: string): void {
    // Remove from queue if pending
    const qIdx = this.queue.findIndex((j) => j.id === jobId)
    if (qIdx !== -1) {
      this.queue.splice(qIdx, 1)
      this.emit('progress', { id: jobId, status: 'cancelled', progress: 0 })
      return
    }
    // Kill active process
    const entry = this.active.get(jobId)
    if (entry) {
      entry.process.kill('SIGTERM')
      this.active.delete(jobId)
      this.emit('progress', { id: jobId, status: 'cancelled', progress: 0 })

      // Cleanup temporary files
      for (const dest of entry.destinations) {
        const cleanupPaths = [dest, `${dest}.part`, `${dest}.ytdl`]
        for (const p of cleanupPaths) {
          try {
            if (fs.existsSync(p)) fs.unlinkSync(p)
          } catch {
            // Ignore deletion errors
          }
        }
      }
      this.tick()
    }
  }

  resume(jobId: string): void {
    // Re-enqueue with same options (yt-dlp will continue from partial file)
    this.emit('progress', { id: jobId, status: 'pending' })
    this.tick()
  }

  private tick(): void {
    while (this.active.size < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!
      this.startJob(job)
    }
  }

  private startJob(job: DownloadJob): void {
    const config = this.store.get('config') as Partial<AppConfig> | undefined
    let outputPath = job.options.outputPath

    if (!outputPath) {
      if (job.options.format === 'audio') {
        outputPath = config?.outputDirectoryAudio || path.join(os.homedir(), 'Music')
      } else {
        outputPath = config?.outputDirectoryVideo || path.join(os.homedir(), 'Videos')
      }
    }

    const ytdlp = getYtdlpBin()
    const ffmpeg = getFfmpegBin()

    // Ensure directory exists
    try {
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
      }
    } catch {
      this.emit('error', {
        id: job.id,
        status: 'error',
        error: `Failed to create directory: ${outputPath}`
      })
      this.tick()
      return
    }

    job.outputPath = outputPath

    const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s')

    const args = buildYtdlpArgs({
      format: job.options.format,
      audioQuality: job.options.audioQuality,
      videoQuality: job.options.videoQuality,
      outputPath: outputPath,
      outputTemplate,
      downloadSubtitles: job.options.downloadSubtitles,
      embedSubtitles: job.options.embedSubtitles,
      subtitleLanguage: job.options.subtitleLanguage,
      embedLyrics: job.options.embedLyrics,
      embedThumbnail: job.options.embedThumbnail,
      embedMetadata: job.options.embedMetadata,
      cookiesFromBrowser: job.options.cookiesFromBrowser,
      cookiesManual: job.options.cookiesManual,
      selectedChapters: job.options.selectedChapters,
      selectedPlaylistItems: job.options.selectedPlaylistItems,
      timeFrom: job.options.timeFrom,
      timeTo: job.options.timeTo,
      customArgs: job.options.customArgs,
      ffmpegBin: ffmpeg,
      customTitle: job.options.customTitle,
      customThumbnail: job.options.customThumbnail,
      customArtist: job.options.customArtist,
      customYear: job.options.customYear,
      customDescription: job.options.customDescription
    })

    // Add URL and continue partial downloads
    args.push('--continue', job.url)

    console.log('[DownloadQueueManager] Executing yt-dlp with args:', args.join(' '))

    this.emit('progress', { id: job.id, status: 'starting', progress: 0 })

    const proc = spawn(ytdlp, args)
    const destinations: string[] = []
    this.active.set(job.id, {
      process: proc,
      options: job.options,
      destinations,
      speedHistory: [],
      progress: 0,
      phase: 'downloading'
    })

    const lastStderrLines: string[] = []

    proc.stdout.on('data', (data: Buffer) => {
      const raw = data.toString()
      console.log(`[yt-dlp stdout ${job.id}]:\n${raw}`)
      // yt-dlp writes [download] progress to stdout
      const lines = raw.split(/[\r\n]+/)
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // Track destination files
        const destMatch = /\[download\] Destination: (.*)/.exec(trimmed)
        if (destMatch) {
          destinations.push(destMatch[1].trim())
          continue
        }
        const extractedAudioMatch = /\[ExtractAudio\] Destination: (.*)/.exec(trimmed)
        if (extractedAudioMatch) {
          destinations.push(extractedAudioMatch[1].trim())
          continue
        }
        const mergeMatch = /\[Merger\] Merging formats into "(.*)"/.exec(trimmed)
        if (mergeMatch) {
          destinations.push(mergeMatch[1].trim())
          continue
        }

        if (
          trimmed.includes('[ExtractAudio]') ||
          trimmed.includes('Merging') ||
          trimmed.includes('[Metadata]') ||
          trimmed.includes('[Thumbnails]') ||
          trimmed.includes('[EmbedSubtitle]') ||
          trimmed.includes('[Fixup]')
        ) {
          const entry = this.active.get(job.id)
          if (entry) entry.phase = 'converting'
          this.emit('progress', { id: job.id, status: 'converting', progress: 99.9 })
          continue
        }

        // Progress line: [download]  45.3% of 128.30MiB at 5.20MiB/s ETA 00:12
        const match = PROGRESS_RE.exec(trimmed)
        if (match) {
          const progress = parseFloat(match[1])
          const size = match[2].trim()
          let speed = match[3].trim()
          const eta = match[4].trim()

          // Speed smoothing
          const entry = this.active.get(job.id)
          if (entry) {
            const currentSpeedBytes = this.parseSpeed(speed)
            if (currentSpeedBytes > 0) {
              entry.speedHistory.push(currentSpeedBytes)
              if (entry.speedHistory.length > 10) entry.speedHistory.shift()
              const avgSpeedBytes =
                entry.speedHistory.reduce((a, b) => a + b, 0) / entry.speedHistory.length
              speed = `~${this.formatSpeed(avgSpeedBytes)}`
            }
          }

          this.emit('progress', { id: job.id, status: 'downloading', progress, size, speed, eta })
        }
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      const raw = data.toString()
      console.log(`[yt-dlp stderr ${job.id}]:\n${raw}`)
      const lines = raw.split(/[\r\n]+/)
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        const destMatch = /\[download\] Destination: (.*)/.exec(trimmed)
        if (destMatch) {
          destinations.push(destMatch[1].trim())
          continue
        }
        const extractedAudioMatch = /\[ExtractAudio\] Destination: (.*)/.exec(trimmed)
        if (extractedAudioMatch) {
          destinations.push(extractedAudioMatch[1].trim())
          continue
        }
        const mergeMatch = /\[Merger\] Merging formats into "(.*)"/.exec(trimmed)
        if (mergeMatch) {
          destinations.push(mergeMatch[1].trim())
          continue
        }

        const downloadMatch = PROGRESS_RE.exec(trimmed)
        if (downloadMatch) {
          const progress = parseFloat(downloadMatch[1])
          const size = downloadMatch[2].trim()
          let speed = downloadMatch[3].trim()
          const eta = downloadMatch[4].trim()

          const entry = this.active.get(job.id)
          if (entry) {
            const currentSpeedBytes = this.parseSpeed(speed)
            if (currentSpeedBytes > 0) {
              entry.speedHistory.push(currentSpeedBytes)
              if (entry.speedHistory.length > 10) entry.speedHistory.shift()
              const avgSpeedBytes =
                entry.speedHistory.reduce((a, b) => a + b, 0) / entry.speedHistory.length
              speed = `~${this.formatSpeed(avgSpeedBytes)}`
            }
          }

          this.emit('progress', { id: job.id, status: 'downloading', progress, size, speed, eta })
          continue
        }

        // ffmpeg conversion progress in stderr — detect and emit converting status
        if (
          trimmed.includes('[ExtractAudio]') ||
          trimmed.includes('Merging') ||
          trimmed.includes('[Metadata]') ||
          trimmed.includes('[Thumbnails]') ||
          trimmed.includes('[EmbedSubtitle]') ||
          trimmed.includes('[Fixup]')
        ) {
          const entry = this.active.get(job.id)
          if (entry) entry.phase = 'converting'
          this.emit('progress', { id: job.id, status: 'converting', progress: 99.9 })
          continue
        }

        if (trimmed.startsWith('size=') && trimmed.includes('time=')) {
          const sizeMatch = /size=\s*(\d+[a-zA-Z]+)/.exec(trimmed)
          const timeMatch = /time=([\d:.]+)/.exec(trimmed)
          const speedMatch = /speed=\s*([\d.]+x|N\/A)/.exec(trimmed)

          const size = sizeMatch ? sizeMatch[1] : ''
          const time = timeMatch ? timeMatch[1] : ''
          const speed = speedMatch ? speedMatch[1] : ''

          const entry = this.active.get(job.id)
          let progress = entry?.progress || 0
          if (entry?.options.expectedDuration && time) {
            const currentSecs = this.parseTimeToSeconds(time)
            progress = Math.min(99.9, (currentSecs / entry.options.expectedDuration) * 100)
            if (entry) entry.progress = progress
          }
          const status = entry?.phase === 'converting' ? 'converting' : 'downloading'

          this.emit('progress', {
            id: job.id,
            status,
            progress,
            size: size,
            speed: speed,
            eta: time
          })
          continue
        }

        // Accumulate all other stderr lines as potential errors
        lastStderrLines.push(trimmed)
        if (lastStderrLines.length > 10) lastStderrLines.shift()
      }
    })

    proc.on('close', (code) => {
      const entry = this.active.get(job.id)
      const finalFilePath =
        entry && entry.destinations.length > 0
          ? entry.destinations[entry.destinations.length - 1]
          : undefined
      const finalFileSize =
        finalFilePath && fs.existsSync(finalFilePath)
          ? this.formatBytes(fs.statSync(finalFilePath).size)
          : undefined

      this.active.delete(job.id)
      if (code === 0) {
        this.emit('completed', {
          id: job.id,
          status: 'done',
          progress: 100,
          outputPath: job.outputPath,
          finalFilePath: finalFilePath,
          size: finalFileSize
        })
      } else if (code !== null) {
        const errorDetail = lastStderrLines.join('').trim() || `yt-dlp exited with code ${code}`
        this.emit('error', {
          id: job.id,
          status: 'error',
          error: errorDetail
        })
      }
      this.tick()
    })

    proc.on('error', (err) => {
      this.active.delete(job.id)
      this.emit('error', { id: job.id, status: 'error', error: err.message })
      this.tick()
    })
  }

  private parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(parseFloat)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return parts[0] || 0
  }

  private parseSpeed(speedStr: string): number {
    const match = /([\d.]+)\s*([a-zA-Z/]+)/.exec(speedStr)
    if (!match) return 0
    const val = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    if (unit.includes('gib')) return val * 1024 * 1024 * 1024
    if (unit.includes('mib')) return val * 1024 * 1024
    if (unit.includes('kib')) return val * 1024
    return val
  }

  private formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec >= 1024 * 1024 * 1024)
      return (bytesPerSec / (1024 * 1024 * 1024)).toFixed(2) + 'GiB/s'
    if (bytesPerSec >= 1024 * 1024) return (bytesPerSec / (1024 * 1024)).toFixed(2) + 'MiB/s'
    if (bytesPerSec >= 1024) return (bytesPerSec / 1024).toFixed(1) + 'KiB/s'
    return bytesPerSec.toFixed(0) + 'B/s'
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + 'GiB'
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + 'MiB'
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + 'KiB'
    return bytes.toFixed(0) + 'B'
  }
}

// Singleton instance
export const downloadQueue = new DownloadQueueManager()

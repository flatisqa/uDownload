import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { EventEmitter } from 'events'
import { getYtdlpBin, getFfmpegBin } from './BinaryManager'
import { buildYtdlpArgs } from './MetadataService'
import Store from 'electron-store'
import type { DownloadJob, DownloadOptions } from '@shared/types/download'

// [download]  45.3% of 128.30MiB at 5.20MiB/s ETA 00:12
// [download]   1.4% of ~123.4MiB at Unknown speed ETA Unknown ETA
const PROGRESS_RE = /\[download\]\s+([\d.]+)%\s+of\s+[~]?([\d.]+\S+)\s+at\s+(.*?)\s+ETA\s+(.*?)$/

type ProcessEntry = {
  process: ChildProcess
  options: DownloadOptions
  destinations: string[]
}

export class DownloadQueueManager extends EventEmitter {
  private queue: DownloadJob[] = []
  private active: Map<string, ProcessEntry> = new Map()
  private store: Store
  private concurrency: number

  constructor(concurrency = 2) {
    super()
    this.store = new (Store as any)()
    this.concurrency = concurrency
  }

  setConcurrency(n: number) {
    this.concurrency = n
    this.tick()
  }

  enqueue(job: DownloadJob) {
    this.queue.push(job)
    // Delay tick to allow IPC main-renderer roundtrip to complete
    setTimeout(() => this.tick(), 50)
  }

  cancel(jobId: string) {
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
          } catch (e) {
            // Ignore deletion errors
          }
        }
      }
      this.tick()
    }
  }

  resume(jobId: string) {
    // Re-enqueue with same options (yt-dlp will continue from partial file)
    this.emit('progress', { id: jobId, status: 'pending' })
    this.tick()
  }

  private tick() {
    while (this.active.size < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!
      this.startJob(job)
    }
  }

  private startJob(job: DownloadJob) {
    const config = this.store.get('config') as any
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
    } catch (e) {
      this.emit('error', { id: job.id, status: 'error', error: `Failed to create directory: ${outputPath}` })
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
      embedThumbnail: job.options.embedThumbnail,
      embedMetadata: job.options.embedMetadata,
      cookiesFromBrowser: job.options.cookiesFromBrowser,
      splitByChapters: job.options.splitByChapters,
      selectedChapters: job.options.selectedChapters,
      selectedPlaylistItems: job.options.selectedPlaylistItems,
      timeFrom: job.options.timeFrom,
      timeTo: job.options.timeTo,
      customArgs: job.options.customArgs,
      ffmpegBin: ffmpeg
    })

    // Add URL and continue partial downloads
    args.push('--continue', job.url)

    console.log('[DownloadQueueManager] Starting yt-dlp with args:', args.join(' '))

    this.emit('progress', { id: job.id, status: 'downloading', progress: 0 })

    const proc = spawn(ytdlp, args)
    const destinations: string[] = []
    this.active.set(job.id, { process: proc, options: job.options, destinations })

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
        if (destMatch) { destinations.push(destMatch[1].trim()); continue }
        const mergeMatch = /\[Merger\] Merging formats into "(.*)"/.exec(trimmed)
        if (mergeMatch) { destinations.push(mergeMatch[1].trim()); continue }

        // Conversion phase detection (yt-dlp stdout messages)
        if (
          trimmed.includes('[ExtractAudio]') ||
          trimmed.includes('[ffmpeg]') ||
          trimmed.includes('Merging')
        ) {
          this.emit('progress', { id: job.id, status: 'converting', progress: 99 })
          continue
        }

        // Progress line: [download]  45.3% of 128.30MiB at 5.20MiB/s ETA 00:12
        const match = PROGRESS_RE.exec(trimmed)
        if (match) {
          const progress = parseFloat(match[1])
          const size = match[2].trim()
          const speed = match[3].trim()
          const eta = match[4].trim()
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

        // ffmpeg conversion progress in stderr — detect and emit converting status
        if (
          trimmed.includes('[ExtractAudio]') ||
          trimmed.includes('[ffmpeg]')
        ) {
          this.emit('progress', { id: job.id, status: 'converting', progress: 99 })
          continue
        }

        if (trimmed.startsWith('size=') && trimmed.includes('time=')) {
          const sizeMatch = /size=\s*(\d+[a-zA-Z]+)/.exec(trimmed)
          const timeMatch = /time=([\d:.]+)/.exec(trimmed)
          const speedMatch = /speed=\s*([\d.]+x|N\/A)/.exec(trimmed)

          const size = sizeMatch ? sizeMatch[1] : ''
          const time = timeMatch ? timeMatch[1] : ''
          const speed = speedMatch ? speedMatch[1] : ''
          
          console.log(`[FFMPEG Match] => size: ${size}, time: ${time}, speed: ${speed}`)
          
          // FFMPEG doesn't give us a hard upper percentage since it's a live stream or chunked.
          // We'll emit progress=50 to keep the bar active as a loading bar,
          // and emit the stats as size/eta/speed fields.
          this.emit('progress', { 
            id: job.id, 
            status: 'downloading', 
            progress: 50, // Faked active progress for indeterminate loaders
            size: size,
            speed: speed,
            eta: time // We'll put the recorded time in the ETA slot so the user sees it moving
          })
          continue
        }

        // Accumulate all other stderr lines as potential errors
        lastStderrLines.push(trimmed)
        if (lastStderrLines.length > 10) lastStderrLines.shift()
      }
    })

    proc.on('close', (code) => {
      this.active.delete(job.id)
      if (code === 0) {
        this.emit('completed', { 
          id: job.id, 
          status: 'done', 
          progress: 100,
          outputPath: job.outputPath
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
}

// Singleton instance
export const downloadQueue = new DownloadQueueManager()

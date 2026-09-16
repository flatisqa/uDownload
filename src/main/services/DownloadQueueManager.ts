import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { EventEmitter } from 'events'
import { getYtdlpBin, getFfmpegBin } from './BinaryManager'
import { buildYtdlpArgs } from './MetadataService'
import Store from 'electron-store'
import type {
  DownloadJob,
  DownloadOptions,
  AppConfig,
  PlaylistProgress
} from '@shared/types/download'
import { DEFAULT_CONFIG } from '@shared/types/download'

// [download]  45.3% of 128.30MiB at 5.20MiB/s ETA 00:12
// [download]   1.4% of ~123.4MiB at Unknown speed ETA Unknown ETA
const PROGRESS_RE = /\[download\]\s+([\d.]+)%\s+of\s+[~]?([\d.]+\S+)\s+at\s+(.*?)\s+ETA\s+(.*?)$/

type ProcessEntry = {
  process: ChildProcess
  job: DownloadJob
  options: DownloadOptions
  destinations: string[]
  speedHistory: number[]
  progress?: number
  phase: 'downloading' | 'converting'
  playlistProgress?: PlaylistProgress
  isMultiTrack?: boolean
  isCancelled?: boolean
}

export class DownloadQueueManager extends EventEmitter {
  private queue: DownloadJob[] = []
  private active: Map<string, ProcessEntry> = new Map()
  private store: Store<AppConfig>
  private concurrency: number

  constructor(concurrency = 2) {
    super()
    this.store = new Store<AppConfig>({ defaults: DEFAULT_CONFIG })
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
      entry.isCancelled = true
      if (entry.process && !entry.process.killed) {
        entry.process.kill('SIGTERM')
      }
      this.active.delete(jobId)
      if (entry.playlistProgress) {
        for (const item of entry.playlistProgress.items) {
          if (item.status !== 'done') {
            item.status = 'cancelled'
          }
        }
      }
      this.emit('progress', {
        id: jobId,
        status: 'cancelled',
        progress: 0,
        playlistProgress: entry.playlistProgress
      })

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
    const entry = this.active.get(jobId)
    if (entry) {
      // Job is still active — nothing to do
      return
    }
    // Find job in queue (already pending)
    const inQueue = this.queue.find((j) => j.id === jobId)
    if (inQueue) return
    // Nothing to do if we don't know the job details anymore
    this.emit('progress', { id: jobId, status: 'pending' })
    // tick in case concurrency slot opened
    this.tick()
  }

  private tick(): void {
    while (this.active.size < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!
      this.startJob(job)
    }
  }

  private startJob(job: DownloadJob): void {
    if (job.options.trackSections && job.options.trackSections.length > 0) {
      this.startMultiTrackJob(job)
      return
    }

    const config = this.store.get('config') as Partial<AppConfig> | undefined
    let outputPath = job.options.outputPath?.trim() || ''

    const defaultAudio = config?.outputDirectoryAudio?.trim() || path.join(os.homedir(), 'Music')
    const defaultVideo = config?.outputDirectoryVideo?.trim() || path.join(os.homedir(), 'Videos')
    const defaultBaseDir = job.options.format === 'audio' ? defaultAudio : defaultVideo

    // Check if outputPath is empty, or mistakenly points to a single folder at root (e.g. "/Протокол души")
    const isBareRootFolder = Boolean(
      outputPath && /^\/[^/]+$/.test(outputPath) && !fs.existsSync(outputPath)
    )

    if (!outputPath || isBareRootFolder || !path.isAbsolute(outputPath)) {
      const folderName = outputPath ? path.basename(outputPath) : ''
      outputPath = folderName ? path.join(defaultBaseDir, folderName) : defaultBaseDir
    }

    job.options.outputPath = outputPath
    job.outputPath = outputPath

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
      cookiesFilePath: job.options.cookiesFilePath,
      selectedChapters: job.options.selectedChapters,
      playlistAll: job.options.playlistAll,
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
    const initialPlaylistProgress: PlaylistProgress | undefined = job.playlistProgress
      ? JSON.parse(JSON.stringify(job.playlistProgress))
      : undefined

    this.active.set(job.id, {
      process: proc,
      job,
      options: job.options,
      destinations,
      speedHistory: [],
      progress: 0,
      phase: 'downloading',
      playlistProgress: initialPlaylistProgress
    })

    const lastStderrLines: string[] = []

    // Unified line parser used for both stdout and stderr
    const parseLine = (trimmed: string, isStderr: boolean): void => {
      // Track playlist item index:
      // [download] Downloading item 1 of 10
      // [download] Downloading video 1 of 10
      // [download] Downloading playlist item 1 of 10
      const playlistItemMatch =
        /\[download\]\s+Downloading\s+(?:playlist\s+)?(?:item|video|track|audio)?\s*(\d+)\s+of\s+(\d+)/i.exec(
          trimmed
        )
      if (playlistItemMatch) {
        const currentItem = parseInt(playlistItemMatch[1], 10)
        const totalItems = parseInt(playlistItemMatch[2], 10)
        const entry = this.active.get(job.id)
        if (entry) {
          entry.phase = 'downloading'
          // Auto-initialize playlistProgress if not provided initially
          if (!entry.playlistProgress && totalItems > 1) {
            entry.playlistProgress = {
              current: currentItem,
              total: totalItems,
              items: Array.from({ length: totalItems }, (_, i) => ({
                id: String(i + 1),
                title: `Трек ${i + 1}`,
                status:
                  i < currentItem - 1 ? 'done' : i === currentItem - 1 ? 'downloading' : 'pending',
                progress: i < currentItem - 1 ? 100 : 0
              }))
            }
          }
          if (entry.playlistProgress) {
            entry.playlistProgress.current = currentItem
            entry.playlistProgress.total = totalItems
            // Mark all items before current as done
            for (let i = 0; i < currentItem - 1; i++) {
              if (entry.playlistProgress.items[i]) {
                entry.playlistProgress.items[i].status = 'done'
                entry.playlistProgress.items[i].progress = 100
              }
            }
            // Mark current item as downloading
            if (entry.playlistProgress.items[currentItem - 1]) {
              entry.playlistProgress.items[currentItem - 1].status = 'downloading'
            }
            const overallProgress = Math.min(99.9, ((currentItem - 1) / totalItems) * 100)
            this.emit('progress', {
              id: job.id,
              status: 'downloading',
              progress: overallProgress,
              playlistProgress: entry.playlistProgress
            })
          }
        }
        return
      }

      // Track item download completion: [download] 100% of 4.04MiB in 00:02
      if (/\[download\]\s+100(?:\.0+)?%\s+of/i.test(trimmed)) {
        const entry = this.active.get(job.id)
        if (entry?.playlistProgress && entry.playlistProgress.total > 0) {
          const currentItemIdx = Math.max(1, entry.playlistProgress.current || 1)
          const itemIdx = currentItemIdx - 1
          if (entry.playlistProgress.items[itemIdx]) {
            entry.playlistProgress.items[itemIdx].progress = 100
          }
        }
      }

      // Track destination files
      const destMatch = /\[download\] Destination: (.*)/.exec(trimmed)
      if (destMatch) {
        destinations.push(destMatch[1].trim())
        return
      }
      const extractedAudioMatch = /\[ExtractAudio\] Destination: (.*)/.exec(trimmed)
      if (extractedAudioMatch) {
        destinations.push(extractedAudioMatch[1].trim())
        return
      }
      const mergeMatch = /\[Merger\] Merging formats into "(.*)"/.exec(trimmed)
      if (mergeMatch) {
        destinations.push(mergeMatch[1].trim())
        return
      }

      // Converting phase indicators
      if (
        trimmed.includes('[ExtractAudio]') ||
        trimmed.includes('Merging') ||
        trimmed.includes('[Metadata]') ||
        trimmed.includes('[Thumbnails]') ||
        trimmed.includes('[EmbedSubtitle]') ||
        trimmed.includes('[Fixup]')
      ) {
        const entry = this.active.get(job.id)
        if (entry) {
          if (entry.playlistProgress && entry.playlistProgress.total > 0) {
            const currentItemIdx = Math.max(1, entry.playlistProgress.current || 1)
            const curIdx = currentItemIdx - 1
            if (entry.playlistProgress.items[curIdx]) {
              entry.playlistProgress.items[curIdx].status = 'converting'
              entry.playlistProgress.items[curIdx].progress = 99.9
            }
            const overallProgress = Math.min(
              99.9,
              ((currentItemIdx - 1) * 100 + 99.9) / entry.playlistProgress.total
            )
            this.emit('progress', {
              id: job.id,
              status: 'downloading',
              progress: overallProgress,
              playlistProgress: entry.playlistProgress
            })
            return
          } else {
            entry.phase = 'converting'
            this.emit('progress', { id: job.id, status: 'converting', progress: 99.9 })
            return
          }
        }
      }

      // yt-dlp progress line: [download]  45.3% of 128.30MiB at 5.20MiB/s ETA 00:12
      const match = PROGRESS_RE.exec(trimmed)
      if (match) {
        const progress = parseFloat(match[1])
        const size = match[2].trim()
        let speed = match[3].trim()
        const eta = match[4].trim()

        const entry = this.active.get(job.id)
        if (entry) {
          entry.phase = 'downloading'
          const currentSpeedBytes = this.parseSpeed(speed)
          if (currentSpeedBytes > 0) {
            entry.speedHistory.push(currentSpeedBytes)
            if (entry.speedHistory.length > 10) entry.speedHistory.shift()
            const avgSpeedBytes =
              entry.speedHistory.reduce((a, b) => a + b, 0) / entry.speedHistory.length
            speed = `~${this.formatSpeed(avgSpeedBytes)}`
          }

          if (entry.playlistProgress && entry.playlistProgress.total > 0) {
            const currentItemIdx = Math.max(1, entry.playlistProgress.current || 1)
            const itemIdx = currentItemIdx - 1
            if (entry.playlistProgress.items[itemIdx]) {
              entry.playlistProgress.items[itemIdx].status = 'downloading'
              entry.playlistProgress.items[itemIdx].progress = progress
              entry.playlistProgress.items[itemIdx].speed = speed
              entry.playlistProgress.items[itemIdx].size = size
            }
            const overallProgress = Math.min(
              99.9,
              ((currentItemIdx - 1) * 100 + progress) / entry.playlistProgress.total
            )
            this.emit('progress', {
              id: job.id,
              status: 'downloading',
              progress: overallProgress,
              size,
              speed,
              eta,
              playlistProgress: entry.playlistProgress
            })
            return
          }
        }
        this.emit('progress', { id: job.id, status: 'downloading', progress, size, speed, eta })
        return
      }

      // ffmpeg progress line in stderr: size= 1234kB time=00:01:23.45 speed=2.5x
      if (isStderr && trimmed.startsWith('size=') && trimmed.includes('time=')) {
        const sizeMatch = /size=\s*(\d+[a-zA-Z]+)/.exec(trimmed)
        const timeMatch = /time=([\d:.]+)/.exec(trimmed)
        const speedMatch = /speed=\s*([\d.]+x|N\/A)/.exec(trimmed)

        const size = sizeMatch ? sizeMatch[1] : ''
        const time = timeMatch ? timeMatch[1] : ''
        const speed = speedMatch ? speedMatch[1] : ''

        const entry = this.active.get(job.id)
        if (entry?.playlistProgress && entry.playlistProgress.total > 0) {
          const currentItemIdx = Math.max(1, entry.playlistProgress.current || 1)
          const itemIdx = currentItemIdx - 1
          const item = entry.playlistProgress.items[itemIdx]
          if (item) {
            item.status = 'converting'
            if (item.duration && time) {
              const currentSecs = this.parseTimeToSeconds(time)
              item.progress = Math.min(99.9, (currentSecs / item.duration) * 100)
            } else {
              item.progress = 99.9
            }
          }
          const itemProgress = item?.progress ?? 99.9
          const overallProgress = Math.min(
            99.9,
            ((currentItemIdx - 1) * 100 + itemProgress) / entry.playlistProgress.total
          )
          this.emit('progress', {
            id: job.id,
            status: 'downloading',
            progress: overallProgress,
            size,
            speed,
            playlistProgress: entry.playlistProgress
          })
          return
        }

        let progress = entry?.progress || 0
        if (entry?.options.expectedDuration && time) {
          const currentSecs = this.parseTimeToSeconds(time)
          progress = Math.min(99.9, (currentSecs / entry.options.expectedDuration) * 100)
          if (entry) entry.progress = progress
        }
        const status = entry?.phase === 'converting' ? 'converting' : 'downloading'
        this.emit('progress', { id: job.id, status, progress, size, speed })
        return
      }

      // Accumulate stderr lines as potential error message
      if (isStderr) {
        lastStderrLines.push(trimmed)
        if (lastStderrLines.length > 10) lastStderrLines.shift()
      }
    }

    proc.stdout.on('data', (data: Buffer) => {
      const raw = data.toString()
      console.log(`[yt-dlp stdout ${job.id}]:\n${raw}`)
      for (const line of raw.split(/[\r\n]+/)) {
        const trimmed = line.trim()
        if (trimmed) parseLine(trimmed, false)
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      const raw = data.toString()
      console.log(`[yt-dlp stderr ${job.id}]:\n${raw}`)
      for (const line of raw.split(/[\r\n]+/)) {
        const trimmed = line.trim()
        if (trimmed) parseLine(trimmed, true)
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
        if (entry?.playlistProgress) {
          for (const item of entry.playlistProgress.items) {
            item.status = 'done'
            item.progress = 100
          }
        }
        this.emit('completed', {
          id: job.id,
          status: 'done',
          progress: 100,
          outputPath: job.outputPath,
          finalFilePath: finalFilePath,
          size: finalFileSize,
          playlistProgress: entry?.playlistProgress
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

  private startMultiTrackJob(job: DownloadJob): void {
    const config = this.store.get('config') as Partial<AppConfig> | undefined
    let outputPath = job.options.outputPath?.trim() || ''

    const defaultAudio = config?.outputDirectoryAudio?.trim() || path.join(os.homedir(), 'Music')
    const defaultVideo = config?.outputDirectoryVideo?.trim() || path.join(os.homedir(), 'Videos')
    const defaultBaseDir = job.options.format === 'audio' ? defaultAudio : defaultVideo

    const isBareRootFolder = Boolean(
      outputPath && /^\/[^/]+$/.test(outputPath) && !fs.existsSync(outputPath)
    )

    if (!outputPath || isBareRootFolder || !path.isAbsolute(outputPath)) {
      const folderName = outputPath ? path.basename(outputPath) : ''
      outputPath = folderName ? path.join(defaultBaseDir, folderName) : defaultBaseDir
    }

    job.options.outputPath = outputPath
    job.outputPath = outputPath

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

    const trackSections = job.options.trackSections!
    const totalTracks = trackSections.length

    // Calculate duration bounds for each track to distribute progress proportionally
    const trackDurations = trackSections.map((t) => {
      const d = t.duration || t.endTime - t.startTime
      return d > 0 ? d : 180
    })
    const totalDurationSec = trackDurations.reduce((a, b) => a + b, 0)

    let accumulatedSec = 0
    const trackBounds = trackDurations.map((dur) => {
      const startPct = totalDurationSec > 0 ? (accumulatedSec / totalDurationSec) * 100 : 0
      accumulatedSec += dur
      const endPct = totalDurationSec > 0 ? (accumulatedSec / totalDurationSec) * 100 : 100
      return { startPct, endPct }
    })

    const initialPlaylistProgress: PlaylistProgress = job.playlistProgress
      ? JSON.parse(JSON.stringify(job.playlistProgress))
      : {
          current: 1,
          total: totalTracks,
          items: trackSections.map((t, idx) => ({
            id: String(idx + 1),
            title: t.title,
            duration: t.duration,
            status: 'pending' as const,
            progress: 0
          }))
        }

    initialPlaylistProgress.current = 1
    if (initialPlaylistProgress.items[0]) {
      initialPlaylistProgress.items[0].status = 'downloading'
    }

    const destinations: string[] = []

    const entry: ProcessEntry = {
      process: null as unknown as ChildProcess,
      job,
      options: job.options,
      destinations,
      speedHistory: [],
      progress: 0,
      phase: 'downloading',
      playlistProgress: initialPlaylistProgress,
      isMultiTrack: true,
      isCancelled: false
    }

    this.active.set(job.id, entry)
    this.emit('progress', {
      id: job.id,
      status: 'starting',
      progress: 0,
      playlistProgress: initialPlaylistProgress
    })

    const ytdlp = getYtdlpBin()
    const ffmpeg = getFfmpegBin()

    const ext =
      job.options.audioQuality === 'mp3'
        ? 'mp3'
        : job.options.audioQuality === 'flac'
          ? 'flac'
          : job.options.audioQuality === 'aac'
            ? 'm4a'
            : 'opus'

    const masterPrefix = `__master_${job.id}`
    const masterTemplate = path.join(outputPath, `${masterPrefix}.%(ext)s`)

    const args = buildYtdlpArgs({
      format: 'audio',
      audioQuality: job.options.audioQuality,
      videoQuality: job.options.videoQuality,
      outputPath,
      outputTemplate: masterTemplate,
      downloadSubtitles: false,
      embedSubtitles: false,
      subtitleLanguage: job.options.subtitleLanguage,
      embedLyrics: job.options.embedLyrics,
      embedThumbnail: job.options.embedThumbnail,
      embedMetadata: job.options.embedMetadata,
      cookiesFromBrowser: job.options.cookiesFromBrowser,
      cookiesManual: job.options.cookiesManual,
      cookiesFilePath: job.options.cookiesFilePath,
      selectedChapters: undefined,
      playlistAll: false,
      timeFrom: undefined,
      timeTo: undefined,
      customArgs: job.options.customArgs,
      ffmpegBin: ffmpeg,
      customTitle: masterPrefix,
      customThumbnail: job.options.customThumbnail,
      customArtist: job.options.customArtist,
      customYear: job.options.customYear,
      customDescription: job.options.customDescription
    })

    args.push('--continue', job.url)
    console.log('[DownloadQueueManager] Downloading master audio with args:', args.join(' '))

    const proc = spawn(ytdlp, args)
    entry.process = proc

    const lastStderrLines: string[] = []

    const parseLine = (trimmed: string, isStderr: boolean): void => {
      const progressMatch = PROGRESS_RE.exec(trimmed)
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1])
        const size = progressMatch[2].trim()
        const speed = progressMatch[3].trim()
        const eta = progressMatch[4].trim()

        if (entry.playlistProgress) {
          // Identify which track is currently receiving audio stream
          let activeIndex = totalTracks - 1
          for (let i = 0; i < totalTracks; i++) {
            if (percent < trackBounds[i].endPct) {
              activeIndex = i
              break
            }
          }

          const isComplete = percent >= 99.8

          for (let i = 0; i < totalTracks; i++) {
            const item = entry.playlistProgress.items[i]
            if (!item) continue
            if (isComplete || i < activeIndex) {
              item.status = 'done'
              item.progress = 100
            } else if (i === activeIndex) {
              item.status = 'downloading'
              const bounds = trackBounds[i]
              const trackRange = bounds.endPct - bounds.startPct
              const trackProgress =
                trackRange > 0
                  ? Math.min(99.9, Math.max(0, ((percent - bounds.startPct) / trackRange) * 100))
                  : 50
              item.progress = trackProgress
              item.speed = speed
            } else {
              item.status = 'pending'
              item.progress = 0
            }
          }

          entry.playlistProgress.current = isComplete ? totalTracks : activeIndex + 1
        }

        this.emit('progress', {
          id: job.id,
          status: 'downloading',
          progress: Math.min(99.9, percent),
          speed,
          eta,
          size,
          playlistProgress: entry.playlistProgress
        })
        return
      }

      if (
        trimmed.includes('[ExtractAudio]') ||
        trimmed.includes('Merging') ||
        trimmed.includes('[Metadata]') ||
        trimmed.includes('[Thumbnails]')
      ) {
        entry.phase = 'converting'
        if (entry.playlistProgress) {
          entry.playlistProgress.current = totalTracks
          for (const item of entry.playlistProgress.items) {
            item.status = 'done'
            item.progress = 100
          }
        }
        this.emit('progress', {
          id: job.id,
          status: 'converting',
          progress: 99.9,
          playlistProgress: entry.playlistProgress
        })
        return
      }

      if (isStderr) {
        lastStderrLines.push(trimmed)
        if (lastStderrLines.length > 10) lastStderrLines.shift()
      }
    }

    proc.stdout.on('data', (data: Buffer) => {
      const raw = data.toString()
      for (const line of raw.split(/[\r\n]+/)) {
        const trimmed = line.trim()
        if (trimmed) parseLine(trimmed, false)
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      const raw = data.toString()
      for (const line of raw.split(/[\r\n]+/)) {
        const trimmed = line.trim()
        if (trimmed) parseLine(trimmed, true)
      }
    })

    proc.on('close', async (code) => {
      if (entry.isCancelled) return

      if (code !== 0) {
        const errorDetail = lastStderrLines.join(' ').trim() || `yt-dlp exited with code ${code}`
        this.active.delete(job.id)
        this.emit('error', { id: job.id, status: 'error', error: errorDetail })
        this.tick()
        return
      }

      // Find downloaded master file
      let foundMaster: string | undefined
      try {
        const files = fs.readdirSync(outputPath)
        foundMaster = files.find((f) => f.startsWith(masterPrefix))
      } catch {
        // Ignore read error
      }

      if (!foundMaster) {
        this.active.delete(job.id)
        this.emit('error', {
          id: job.id,
          status: 'error',
          error: 'Master audio file not found after download'
        })
        this.tick()
        return
      }

      const masterAudioPath = path.join(outputPath, foundMaster)
      const masterExt = path.extname(foundMaster).slice(1) || ext

      // Stage 2: Instant local slicing with FFmpeg
      entry.phase = 'converting'
      if (entry.playlistProgress) {
        entry.playlistProgress.current = totalTracks
        for (const item of entry.playlistProgress.items) {
          item.status = 'done'
          item.progress = 100
        }
      }
      this.emit('progress', {
        id: job.id,
        status: 'converting',
        progress: 99.9,
        playlistProgress: entry.playlistProgress
      })

      for (let i = 0; i < totalTracks; i++) {
        if (entry.isCancelled) break

        const track = trackSections[i]
        const cleanTrackTitle = track.title.replace(/[\\/:*?"<>|]/g, '_').trim()
        const trackOutPath = path.join(outputPath, `${cleanTrackTitle}.${masterExt}`)
        destinations.push(trackOutPath)

        const ffmpegArgs = [
          '-y',
          '-ss',
          String(track.startTime),
          '-to',
          String(track.endTime),
          '-i',
          masterAudioPath,
          '-c',
          'copy',
          '-metadata',
          `title=${track.title}`,
          '-metadata',
          `track=${i + 1}/${totalTracks}`,
          trackOutPath
        ]

        await new Promise<void>((resolve) => {
          const ff = spawn(ffmpeg, ffmpegArgs)
          entry.process = ff
          ff.on('close', () => resolve())
          ff.on('error', () => resolve())
        })
      }

      // Clean up master audio file
      try {
        if (fs.existsSync(masterAudioPath)) {
          fs.unlinkSync(masterAudioPath)
        }
      } catch {
        // Ignore deletion error
      }

      if (entry.isCancelled) return

      this.active.delete(job.id)

      let totalBytes = 0
      for (const dest of destinations) {
        try {
          if (fs.existsSync(dest)) totalBytes += fs.statSync(dest).size
        } catch {
          // Ignore file access error
        }
      }
      const finalSize = totalBytes > 0 ? this.formatBytes(totalBytes) : undefined
      const finalFilePath =
        destinations.length > 0 ? destinations[destinations.length - 1] : undefined

      this.emit('completed', {
        id: job.id,
        status: 'done',
        progress: 100,
        outputPath: job.outputPath,
        finalFilePath,
        size: finalSize,
        playlistProgress: entry.playlistProgress
      })
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

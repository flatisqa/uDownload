import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { execFile, execSync } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface BinaryStatus {
  ytdlp: boolean
  ytdlpVersion?: string
  ffmpeg: boolean
  ffmpegVersion?: string
}

const YTDLP_RELEASES_URL = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'

function getBinDir(): string {
  return path.join(app.getPath('userData'), 'binaries')
}

function getYtdlpPath(): string {
  const ext = process.platform === 'win32' ? '.exe' : ''
  return path.join(getBinDir(), `yt-dlp${ext}`)
}

function getFfmpegPath(): string {
  const ext = process.platform === 'win32' ? '.exe' : ''
  return path.join(getBinDir(), `ffmpeg${ext}`)
}

function getYtdlpDownloadUrl(tag: string): string {
  if (process.platform === 'win32') {
    return `https://github.com/yt-dlp/yt-dlp/releases/download/${tag}/yt-dlp.exe`
  }
  if (process.platform === 'darwin') {
    return `https://github.com/yt-dlp/yt-dlp/releases/download/${tag}/yt-dlp_macos`
  }
  if (process.platform === 'linux') {
    if (process.arch === 'arm64') {
      return `https://github.com/yt-dlp/yt-dlp/releases/download/${tag}/yt-dlp_linux_aarch64`
    }
    return `https://github.com/yt-dlp/yt-dlp/releases/download/${tag}/yt-dlp_linux`
  }
  return `https://github.com/yt-dlp/yt-dlp/releases/download/${tag}/yt-dlp`
}

function getFfmpegDownloadUrl(): string {
  if (process.platform === 'win32') {
    return 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'
  }
  // For Linux — the user likely already has ffmpeg or we guide them
  return ''
}

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const file = fs.createWriteStream(dest)
    const followRedirect = (u: string): void => {
      https
        .get(u, { headers: { 'User-Agent': 'uDowload/1.0' } }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            followRedirect(res.headers.location!)
          } else if (res.statusCode === 200) {
            res.pipe(file)
            file.on('finish', () => {
              file.close()
              resolve()
            })
          } else {
            reject(new Error(`HTTP ${res.statusCode} during download`))
          }
        })
        .on('error', reject)
    }
    followRedirect(url)
  })
}

async function getLatestYtdlpTag(): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(YTDLP_RELEASES_URL, { headers: { 'User-Agent': 'uDowload/1.0' } }, (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.tag_name)
          } catch {
            reject(new Error('Failed to parse yt-dlp release info'))
          }
        })
      })
      .on('error', reject)
  })
}

function isLikelyZipimportYtdlp(binaryPath: string): boolean {
  try {
    const fd = fs.openSync(binaryPath, 'r')
    const header = Buffer.alloc(2)
    fs.readSync(fd, header, 0, 2, 0)
    fs.closeSync(fd)
    return header.toString('utf8') === '#!'
  } catch {
    return false
  }
}

export async function getStatus(): Promise<BinaryStatus> {
  const ytdlpPath = getYtdlpPath()
  const ffmpegPath = getFfmpegPath()

  let ytdlp = fs.existsSync(ytdlpPath)
  let ytdlpVersion: string | undefined
  let ffmpeg = fs.existsSync(ffmpegPath)
  let ffmpegVersion: string | undefined

  if (ytdlp && process.platform === 'linux' && isLikelyZipimportYtdlp(ytdlpPath)) {
    ytdlp = false
    ytdlpVersion = 'zipimport-build-detected'
  }

  // Also check system ffmpeg (Linux)
  if (!ffmpeg && process.platform === 'linux') {
    try {
      const { stdout } = await execFileAsync('ffmpeg', ['-version'])
      if (stdout) {
        ffmpeg = true
        ffmpegVersion = stdout.split('\n')[0]
      }
    } catch {
      // ffmpeg not found on PATH
    }
  }

  if (ytdlp) {
    try {
      const { stdout } = await execFileAsync(ytdlpPath, ['--version'])
      ytdlpVersion = stdout.trim()
    } catch {
      ytdlp = false
    }
  }

  if (ffmpeg && !ffmpegVersion) {
    try {
      const { stdout } = await execFileAsync(ffmpegPath, ['-version'])
      ffmpegVersion = stdout.split('\n')[0]
    } catch {
      ffmpegVersion = 'unknown'
    }
  }

  return { ytdlp, ytdlpVersion, ffmpeg, ffmpegVersion }
}

export async function downloadYtdlp(): Promise<void> {
  const tag = await getLatestYtdlpTag()
  const url = getYtdlpDownloadUrl(tag)
  const dest = getYtdlpPath()
  await downloadFile(url, dest)
  // Make executable on Linux/Mac
  if (process.platform !== 'win32') {
    fs.chmodSync(dest, 0o755)
  }
}

export async function downloadFfmpeg(): Promise<void> {
  // On Linux: ffmpeg should be installed via package manager (apt / dnf)
  // We inform user if missing; on Windows we download a build
  if (process.platform === 'linux') {
    throw new Error(
      'ffmpeg not found. Please install it via your package manager:\n  sudo apt install ffmpeg'
    )
  }
  // Windows: placeholder — full zip extraction to be expanded
  const url = getFfmpegDownloadUrl()
  if (!url) throw new Error('No ffmpeg download URL for this platform')
  const dest = getFfmpegPath().replace('.exe', '-dist.zip')
  await downloadFile(url, dest)
  // TODO: extract zip and place ffmpeg.exe in binaries folder
}

export async function checkAndUpdate(): Promise<string> {
  const tag = await getLatestYtdlpTag()
  const ytdlpPath = getYtdlpPath()

  // Check current version
  let currentVersion = ''
  if (fs.existsSync(ytdlpPath)) {
    try {
      const { stdout } = await execFileAsync(ytdlpPath, ['--version'])
      currentVersion = stdout.trim()
    } catch {
      currentVersion = ''
    }
  }

  const needsLinuxStandaloneMigration =
    process.platform === 'linux' && fs.existsSync(ytdlpPath) && isLikelyZipimportYtdlp(ytdlpPath)

  if (currentVersion === tag && !needsLinuxStandaloneMigration) {
    return `yt-dlp is already up to date (${tag})`
  }

  await downloadYtdlp()
  if (needsLinuxStandaloneMigration) {
    return `yt-dlp migrated to standalone Linux binary with bundled dependencies (${tag})`
  }
  return `yt-dlp updated to ${tag}`
}

export function getYtdlpBin(): string {
  const p = getYtdlpPath()
  if (fs.existsSync(p)) return p
  // Fallback to system-installed (Linux)
  return 'yt-dlp'
}

export function getFfmpegBin(): string {
  const p = getFfmpegPath()
  if (fs.existsSync(p)) return p
  // Check if ffmpeg is in system PATH
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which'
    const fullPath = execSync(`${whichCmd} ffmpeg`).toString().trim().split('\n')[0]
    if (fullPath) return fullPath
  } catch {
    // Not on path
  }
  return 'ffmpeg'
}

import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
import { execFile, execSync } from 'child_process'
import { promisify } from 'util'
import Store from 'electron-store'
import type { AppConfig, BinaryStatus, BinaryUpdateProgress } from '@shared/types/download'
import { DEFAULT_CONFIG } from '@shared/types/download'

const execFileAsync = promisify(execFile)
const store = new Store<AppConfig>({ defaults: DEFAULT_CONFIG })

export type { BinaryStatus }

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

function getFfmpegDownloadUrl(branch = '9.0'): string {
  if (process.platform === 'win32') {
    return `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n${branch}-latest-win64-gpl-${branch}.zip`
  }
  if (process.platform === 'linux') {
    if (process.arch === 'arm64') {
      return `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n${branch}-latest-linuxarm64-gpl-${branch}.tar.xz`
    }
    return `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n${branch}-latest-linux64-gpl-${branch}.tar.xz`
  }
  if (process.platform === 'darwin') {
    return 'https://evermeet.cx/ffmpeg/getrelease/zip'
  }
  return ''
}

export async function getLatestFfmpegAvailableVersion(): Promise<string> {
  try {
    return await new Promise<string>((resolve) => {
      const req = https.get(
        'https://ffmpeg.org/download.html',
        { headers: { 'User-Agent': 'uDownload/1.0' } },
        (res) => {
          let data = ''
          res.on('data', (c) => (data += c))
          res.on('end', () => {
            const match = data.match(/FFmpeg\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i)
            resolve(match ? match[1] : '9.0.1')
          })
        }
      )
      req.on('error', () => resolve('9.0.1'))
      req.setTimeout(5000, () => {
        req.destroy()
        resolve('9.0.1')
      })
    })
  } catch {
    return '9.0.1'
  }
}

async function downloadFile(
  url: string,
  dest: string,
  onProgress?: (percent: number, currentBytes: number, totalBytes: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const followRedirect = (u: string, redirectCount = 0): void => {
      if (redirectCount > 5) {
        return reject(new Error('Слишком много перенаправлений (redirect loop)'))
      }

      const client = u.startsWith('https:') ? https : http
      client
        .get(u, { headers: { 'User-Agent': 'uDowload/1.0' } }, (res) => {
          if (
            res.statusCode === 301 ||
            res.statusCode === 302 ||
            res.statusCode === 303 ||
            res.statusCode === 307 ||
            res.statusCode === 308
          ) {
            const redirectUrl = res.headers.location
            if (!redirectUrl) {
              return reject(new Error('Отсутствует адрес перенаправления (location)'))
            }
            followRedirect(redirectUrl, redirectCount + 1)
          } else if (res.statusCode === 200) {
            const totalBytes = parseInt(res.headers['content-length'] || '0', 10)
            let receivedBytes = 0
            let lastEmitPercent = -1

            const file = fs.createWriteStream(dest)

            res.on('data', (chunk: Buffer) => {
              receivedBytes += chunk.length
              if (totalBytes > 0 && onProgress) {
                const percent = Math.min(99, Math.round((receivedBytes / totalBytes) * 100))
                if (percent !== lastEmitPercent) {
                  lastEmitPercent = percent
                  onProgress(percent, receivedBytes, totalBytes)
                }
              }
            })

            res.pipe(file)
            file.on('finish', () => {
              file.close()
              if (onProgress) {
                onProgress(100, receivedBytes, totalBytes || receivedBytes)
              }
              resolve()
            })
            file.on('error', (err) => {
              try {
                if (fs.existsSync(dest)) fs.unlinkSync(dest)
              } catch {
                /* ignore */
              }
              reject(err)
            })
          } else {
            reject(new Error(`HTTP ${res.statusCode} при скачивании файла`))
          }
        })
        .on('error', (err) => {
          try {
            if (fs.existsSync(dest)) fs.unlinkSync(dest)
          } catch {
            /* ignore */
          }
          reject(err)
        })
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

function parseFfmpegVersion(rawStdout: string): string {
  const firstLine = rawStdout.split('\n')[0].trim()
  const match = firstLine.match(/ffmpeg\s+version\s+([^\s]+)/i)
  if (!match) return firstLine

  const rawVer = match[1]
  const savedVer = store.get('installedFfmpegVersion')
  if (savedVer && (rawVer.startsWith('N-') || rawVer.startsWith('n') || rawVer.startsWith('9.'))) {
    return savedVer
  }

  const gitMasterMatch = rawVer.match(/N-\d+-g[a-f0-9]+-(\d{4})(\d{2})(\d{2})/i)
  if (gitMasterMatch) {
    const [, y, m, d] = gitMasterMatch
    return `9.0.1 (${d}.${m}.${y})`
  }
  if (/^n\d+\./i.test(rawVer)) {
    return rawVer.replace(/^n/i, '')
  }
  return rawVer
}

export async function getStatus(): Promise<BinaryStatus> {
  const ytdlpPath = getYtdlpPath()
  const ffmpegPath = getFfmpegPath()
  const ffmpegSource = store.get('ffmpegSource') || 'standalone'

  let ytdlp = fs.existsSync(ytdlpPath)
  let ytdlpVersion: string | undefined

  let standaloneFfmpeg = fs.existsSync(ffmpegPath)
  let standaloneFfmpegVersion: string | undefined

  let systemFfmpeg = false
  let systemFfmpegVersion: string | undefined

  if (ytdlp && process.platform === 'linux' && isLikelyZipimportYtdlp(ytdlpPath)) {
    ytdlp = false
    ytdlpVersion = 'zipimport-build-detected'
  }

  // 1. Check standalone ffmpeg
  if (standaloneFfmpeg) {
    try {
      const { stdout } = await execFileAsync(ffmpegPath, ['-version'])
      standaloneFfmpegVersion = parseFfmpegVersion(stdout)
    } catch {
      standaloneFfmpeg = false
    }
  }

  // 2. Check system / Homebrew ffmpeg
  if (process.platform === 'darwin') {
    const macPaths = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/local/bin/ffmpeg']
    for (const mp of macPaths) {
      if (fs.existsSync(mp)) {
        try {
          const { stdout } = await execFileAsync(mp, ['-version'])
          if (stdout) {
            systemFfmpeg = true
            systemFfmpegVersion = parseFfmpegVersion(stdout)
            break
          }
        } catch {
          /* ignore */
        }
      }
    }
  }
  if (!systemFfmpeg) {
    try {
      const { stdout } = await execFileAsync('ffmpeg', ['-version'])
      if (stdout) {
        systemFfmpeg = true
        systemFfmpegVersion = parseFfmpegVersion(stdout)
      }
    } catch {
      /* ignore */
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

  const activeFfmpeg = ffmpegSource === 'standalone' ? standaloneFfmpeg : systemFfmpeg
  const activeFfmpegVersion =
    ffmpegSource === 'standalone'
      ? standaloneFfmpegVersion || systemFfmpegVersion
      : systemFfmpegVersion || standaloneFfmpegVersion

  return {
    ytdlp,
    ytdlpVersion,
    ffmpeg: Boolean(activeFfmpeg || standaloneFfmpeg || systemFfmpeg),
    ffmpegVersion: activeFfmpegVersion,
    ffmpegSource,
    standaloneFfmpegVersion,
    systemFfmpegVersion
  }
}

export async function downloadYtdlp(): Promise<void> {
  const tag = await getLatestYtdlpTag()
  const url = getYtdlpDownloadUrl(tag)
  const dest = getYtdlpPath()
  await downloadFile(url, dest)
  if (process.platform !== 'win32') {
    fs.chmodSync(dest, 0o755)
  }
}

export async function downloadFfmpeg(
  branch = '9.0',
  onProgress?: (percent: number, currentBytes: number, totalBytes: number) => void
): Promise<void> {
  const url = getFfmpegDownloadUrl(branch)
  if (!url) {
    throw new Error('Не найдена ссылка для скачивания FFmpeg под данную платформу')
  }

  const binDir = getBinDir()
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true })
  }

  const isZip = url.endsWith('.zip')
  const ext = isZip ? '.zip' : '.tar.xz'
  const destArchive = path.join(binDir, `ffmpeg-temp-archive${ext}`)
  const tempExtractDir = path.join(binDir, `__ffmpeg_extract_${Date.now()}`)

  try {
    await downloadFile(url, destArchive, onProgress)

    fs.mkdirSync(tempExtractDir, { recursive: true })

    if (process.platform === 'win32') {
      await execFileAsync('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `Expand-Archive -LiteralPath '${destArchive}' -DestinationPath '${tempExtractDir}' -Force`
      ])
    } else if (isZip) {
      await execFileAsync('unzip', ['-o', destArchive, '-d', tempExtractDir])
    } else {
      await execFileAsync('tar', ['-xf', destArchive, '-C', tempExtractDir])
    }

    const ffmpegTarget = getFfmpegPath()
    const ffprobeTarget = ffmpegTarget.replace(/ffmpeg(\.exe)?$/, `ffprobe$1`)

    const findFile = (dir: string, fileName: string): string | null => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          const found = findFile(fullPath, fileName)
          if (found) return found
        } else if (entry.name.toLowerCase() === fileName.toLowerCase()) {
          return fullPath
        }
      }
      return null
    }

    const binaryName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    const probeName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'

    const extractedFfmpeg = findFile(tempExtractDir, binaryName)
    if (!extractedFfmpeg) {
      throw new Error(`Не удалось найти бинарник ${binaryName} внутри архива`)
    }

    fs.copyFileSync(extractedFfmpeg, ffmpegTarget)
    if (process.platform !== 'win32') {
      fs.chmodSync(ffmpegTarget, 0o755)
      if (process.platform === 'darwin') {
        try {
          execSync(`xattr -d com.apple.quarantine "${ffmpegTarget}"`)
        } catch {
          /* ignore */
        }
      }
    }

    // Also copy ffprobe if present
    const extractedProbe = findFile(tempExtractDir, probeName)
    if (extractedProbe) {
      try {
        fs.copyFileSync(extractedProbe, ffprobeTarget)
        if (process.platform !== 'win32') {
          fs.chmodSync(ffprobeTarget, 0o755)
          if (process.platform === 'darwin') {
            try {
              execSync(`xattr -d com.apple.quarantine "${ffprobeTarget}"`)
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
  } finally {
    try {
      if (fs.existsSync(destArchive)) fs.unlinkSync(destArchive)
    } catch {
      /* ignore */
    }
    try {
      if (fs.existsSync(tempExtractDir)) fs.rmSync(tempExtractDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }
}

export async function checkAndUpdate(
  onProgress?: (prog: BinaryUpdateProgress) => void
): Promise<string> {
  const results: string[] = []
  const ffmpegSource = store.get('ffmpegSource') || 'standalone'

  // 1. Check/Update yt-dlp
  try {
    if (onProgress) {
      onProgress({
        component: 'ytdlp',
        status: 'checking',
        message: 'Проверка обновлений yt-dlp...'
      })
    }
    const tag = await getLatestYtdlpTag()
    const ytdlpPath = getYtdlpPath()
    let currentYtdlpVersion = ''
    if (fs.existsSync(ytdlpPath)) {
      try {
        const { stdout } = await execFileAsync(ytdlpPath, ['--version'])
        currentYtdlpVersion = stdout.trim()
      } catch {
        currentYtdlpVersion = ''
      }
    }

    const needsLinuxStandaloneMigration =
      process.platform === 'linux' && fs.existsSync(ytdlpPath) && isLikelyZipimportYtdlp(ytdlpPath)

    if (currentYtdlpVersion === tag && !needsLinuxStandaloneMigration) {
      results.push(`yt-dlp: актуален (${tag})`)
    } else {
      if (onProgress) {
        onProgress({
          component: 'ytdlp',
          status: 'downloading',
          message: `Скачивание yt-dlp (${tag})...`
        })
      }
      await downloadYtdlp()
      results.push(
        needsLinuxStandaloneMigration
          ? `yt-dlp: обновлен (standalone ${tag})`
          : `yt-dlp: обновлен (${tag})`
      )
    }
  } catch (err) {
    results.push(`yt-dlp: ошибка (${(err as Error).message})`)
  }

  // 2. Check/Update FFmpeg based on chosen source
  try {
    const ffmpegPath = getFfmpegPath()
    const hadLocalFfmpeg = fs.existsSync(ffmpegPath)

    if (onProgress) {
      onProgress({
        component: 'ffmpeg',
        status: 'checking',
        message: 'Проверка версий FFmpeg...'
      })
    }
    const latestVer = await getLatestFfmpegAvailableVersion()
    const status = await getStatus()

    if (ffmpegSource === 'system') {
      // User chose system FFmpeg: DO NOT download archive, just check if newer exists
      const currentSys = status.systemFfmpegVersion || 'не обнаружен'

      results.push(
        `FFmpeg: используется системный (${currentSys}). Доступна автономная версия ${latestVer} — переключитесь на «Автономный», чтобы скачать.`
      )
    } else {
      const currentStandalone = status.standaloneFfmpegVersion
      const savedVer = store.get('installedFfmpegVersion')

      // Check if standalone FFmpeg is already installed and up to date
      const isAlreadyUpToDate =
        hadLocalFfmpeg &&
        (savedVer === latestVer ||
          (currentStandalone &&
            (currentStandalone === latestVer ||
              currentStandalone.startsWith('9.') ||
              currentStandalone.includes('9.0.1'))))

      if (isAlreadyUpToDate) {
        store.set('installedFfmpegVersion', latestVer)
        results.push(`FFmpeg (автономный): актуален (${latestVer})`)
      } else {
        if (onProgress) {
          onProgress({
            component: 'ffmpeg',
            status: 'downloading',
            percent: 0,
            message: `Подготовка к загрузке FFmpeg ${latestVer}...`
          })
        }

        const branchMatch = latestVer.match(/^(\d+\.\d+)/)
        const branch = branchMatch ? branchMatch[1] : '9.0'

        await downloadFfmpeg(branch, (percent, currentBytes, totalBytes) => {
          if (onProgress) {
            const currentMB = (currentBytes / (1024 * 1024)).toFixed(1)
            const totalMB = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : '?'
            onProgress({
              component: 'ffmpeg',
              status: 'downloading',
              percent,
              currentBytes,
              totalBytes,
              message: `Скачивание FFmpeg: ${percent}% (${currentMB} из ${totalMB} МБ)...`
            })
          }
        })

        if (onProgress) {
          onProgress({
            component: 'ffmpeg',
            status: 'extracting',
            percent: 100,
            message: 'Распаковка и установка FFmpeg...'
          })
        }

        store.set('installedFfmpegVersion', latestVer)
        results.push(
          hadLocalFfmpeg
            ? `FFmpeg (автономный): обновлен (${latestVer})`
            : `FFmpeg (автономный): установлен (${latestVer})`
        )
      }
    }
  } catch (err) {
    results.push(`FFmpeg: ошибка (${(err as Error).message})`)
  }

  if (onProgress) {
    onProgress({
      component: 'ffmpeg',
      status: 'done',
      message: results.join(' | ')
    })
  }

  return results.join(' | ')
}

export function getYtdlpBin(): string {
  const p = getYtdlpPath()
  if (fs.existsSync(p)) return p
  return 'yt-dlp'
}

export function getFfmpegBin(): string {
  const ffmpegSource = store.get('ffmpegSource') || 'standalone'
  const standalonePath = getFfmpegPath()

  if (ffmpegSource === 'standalone' && fs.existsSync(standalonePath)) {
    return standalonePath
  }

  if (process.platform === 'darwin') {
    const macPaths = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/local/bin/ffmpeg']
    for (const mp of macPaths) {
      if (fs.existsSync(mp)) return mp
    }
  }

  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which'
    const fullPath = execSync(`${whichCmd} ffmpeg`).toString().trim().split('\n')[0]
    if (fullPath && fs.existsSync(fullPath)) return fullPath
  } catch {
    /* not on path */
  }

  if (fs.existsSync(standalonePath)) {
    return standalonePath
  }

  return 'ffmpeg'
}

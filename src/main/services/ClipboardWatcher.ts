import { EventEmitter } from 'events'

export class ClipboardWatcher extends EventEmitter {
  private interval: NodeJS.Timeout | null = null
  private lastText = ''
  private enabled = false

  // URL patterns: YouTube (watch, shorts, live, music, playlist), SoundCloud, Vimeo, Twitter, TikTok, Instagram
  private static URL_RE =
    /https?:\/\/(www\.|music\.|m\.)?(youtube\.com\/(watch|shorts|live|playlist|v\/)|youtu\.be\/|soundcloud\.com|vimeo\.com|twitter\.com|x\.com|twitch\.tv|tiktok\.com|instagram\.com|reddit\.com\/r\/)[^\s"')>]*/

  start() {
    if (this.interval) return
    this.enabled = true
    const { clipboard } = require('electron')
    this.interval = setInterval(() => {
      if (!this.enabled) return
      try {
        const rawText = clipboard.readText()
        if (!rawText) return

        const text = rawText.trim()
        if (text && text !== this.lastText) {
          this.lastText = text
          const match = ClipboardWatcher.URL_RE.exec(text)
          if (match) {
            console.log('[ClipboardWatcher] Detected supported link:', text)
            this.emit('linkDetected', text)
          }
        }
      } catch {
        // Ignore clipboard read errors
      }
    }, 1000)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.enabled = false
  }

  setEnabled(enabled: boolean) {
    if (enabled) this.start()
    else this.stop()
  }
}

export const clipboardWatcher = new ClipboardWatcher()

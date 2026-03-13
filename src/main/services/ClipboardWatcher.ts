import { EventEmitter } from 'events'

export class ClipboardWatcher extends EventEmitter {
  private interval: NodeJS.Timeout | null = null
  private lastText = ''
  private enabled = false

  // URL patterns: YouTube, SoundCloud, Vimeo, Twitter, etc.
  private static URL_RE =
    /https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|soundcloud\.com|vimeo\.com|twitter\.com|x\.com|twitch\.tv|reddit\.com\/r\/)[^\s"')>]*/

  start() {
    if (this.interval) return
    this.enabled = true
    const { clipboard } = require('electron')
    this.interval = setInterval(() => {
      if (!this.enabled) return
      try {
        const text = clipboard.readText()
        if (text && text !== this.lastText) {
          this.lastText = text
          const match = ClipboardWatcher.URL_RE.exec(text)
          if (match) {
            this.emit('linkDetected', text.trim())
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

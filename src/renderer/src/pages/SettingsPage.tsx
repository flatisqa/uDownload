import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { MediaFormat, AudioQuality, VideoQuality } from '@shared/types/download'
import { useTranslation } from '../i18n'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  )
}

export default function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const t = useTranslation(settings.language)

  const [binaryStatus, setBinaryStatus] = useState<{
    ytdlp: boolean
    ytdlpVersion?: string
    ffmpeg: boolean
    ffmpegVersion?: string
  } | null>(null)
  const [updateMsg, setUpdateMsg] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const [showPresetForm, setShowPresetForm] = useState(false)
  const [presetForm, setPresetForm] = useState({
    name: '',
    emoji: '🔥',
    format: 'audio+video' as MediaFormat,
    audioQuality: 'best' as AudioQuality,
    videoQuality: '1080p' as VideoQuality
  })

  useEffect(() => {
    window.api.getBinaryStatus().then((res) => {
      if (res.success && res.data) setBinaryStatus(res.data)
    })
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    setUpdateMsg('')
    const res = await window.api.checkAndUpdateBinaries()
    setUpdateMsg(res.data || res.error || 'Done')
    setIsUpdating(false)
    // Refresh status
    window.api.getBinaryStatus().then((r) => {
      if (r.success && r.data) setBinaryStatus(r.data)
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="heading-xl">{t('settingsTitle')}</h1>
      </div>

      {/* Appearance */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('appearance')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                display: 'block',
                marginBottom: 6
              }}
            >
              {t('language').toUpperCase()}
            </label>
            <select
              className="input"
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as 'en' | 'ru' })}
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>
          <div>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                display: 'block',
                marginBottom: 6
              }}
            >
              {t('theme').toUpperCase()}
            </label>
            <select
              className="input"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as any })}
            >
              <option value="system">{t('themeSystem')}</option>
              <option value="deep-space">{t('themeDeepSpace')}</option>
              <option value="midnight-purple">{t('themeMidnightPurple')}</option>
              <option value="crimson-wave">{t('themeCrimsonWave')}</option>
              <option value="arctic-steel">{t('themeArcticSteel')}</option>
              <option value="sunset-amber">{t('themeSunsetAmber')}</option>
              <option value="graphite-pro">{t('themeGraphitePro')}</option>
              <option value="sakura-rain">{t('themeSakuraRain')}</option>
              <option value="forest-terminal">{t('themeForestTerminal')}</option>
              <option value="light">{t('themeLight')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Download */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('downloadSec')}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 48,
            marginBottom: 14
          }}
        >
          <div style={{ minWidth: 0 }}>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                display: 'block',
                marginBottom: 8
              }}
            >
              {t('saveFolderVideo')}
            </label>
            <div className="flex gap-8">
              <input
                className="input flex-1"
                style={{ minWidth: 0 }}
                readOnly
                value={settings.outputDirectoryVideo || '~/Downloads'}
                placeholder="~/Downloads"
              />
              <button
                className="btn btn-ghost"
                style={{ flexShrink: 0 }}
                onClick={async () => {
                  const res = await window.api.openFolderDialog()
                  if (res.success && res.data) updateSettings({ outputDirectoryVideo: res.data })
                }}
              >
                {t('browse')}
              </button>
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                display: 'block',
                marginBottom: 8
              }}
            >
              {t('saveFolderAudio')}
            </label>
            <div className="flex gap-8">
              <input
                className="input flex-1"
                style={{ minWidth: 0 }}
                readOnly
                value={settings.outputDirectoryAudio || '~/Downloads'}
                placeholder="~/Downloads"
              />
              <button
                className="btn btn-ghost"
                style={{ flexShrink: 0 }}
                onClick={async () => {
                  const res = await window.api.openFolderDialog()
                  if (res.success && res.data) updateSettings({ outputDirectoryAudio: res.data })
                }}
              >
                {t('browse')}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              color: 'var(--text-secondary)',
              fontSize: 11,
              display: 'block',
              marginBottom: 6
            }}
          >
            {t('concurrent')}: {settings.concurrentDownloads}
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={settings.concurrentDownloads}
            onChange={(e) => updateSettings({ concurrentDownloads: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        </div>
      </section>

      {/* Subtitles */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('subtitlesSec')}
        </p>
        <div className="toggle-wrap">
          <span style={{ fontSize: 13 }}>{t('downloadSubs')}</span>
          <Toggle
            checked={settings.downloadSubtitles}
            onChange={(v) => updateSettings({ downloadSubtitles: v })}
          />
        </div>
        {settings.downloadSubtitles && (
          <>
            <div className="toggle-wrap">
              <span style={{ fontSize: 13 }}>{t('embedSubs')}</span>
              <Toggle
                checked={settings.embedSubtitles}
                onChange={(v) => updateSettings({ embedSubtitles: v })}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <label
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  display: 'block',
                  marginBottom: 6
                }}
              >
                {t('subsLang')}
              </label>
              <input
                className="input"
                value={settings.subtitleLanguage}
                onChange={(e) => updateSettings({ subtitleLanguage: e.target.value })}
                placeholder="ru, en, de..."
              />
            </div>
          </>
        )}
      </section>

      {/* Metadata */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('metadataSec')}
        </p>
        <div className="toggle-wrap">
          <span style={{ fontSize: 13 }}>{t('embedThumb')}</span>
          <Toggle
            checked={settings.embedThumbnail}
            onChange={(v) => updateSettings({ embedThumbnail: v })}
          />
        </div>
        <div className="toggle-wrap">
          <span style={{ fontSize: 13 }}>{t('embedMeta')}</span>
          <Toggle
            checked={settings.embedMetadata}
            onChange={(v) => updateSettings({ embedMetadata: v })}
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <label
            style={{
              color: 'var(--text-secondary)',
              fontSize: 11,
              display: 'block',
              marginBottom: 6
            }}
          >
            {t('useCookies')}
          </label>
          <select
            className="input"
            value={settings.cookiesFromBrowser}
            onChange={(e) => updateSettings({ cookiesFromBrowser: e.target.value })}
          >
            <option value="">{t('useCookiesNone')}</option>
            <option value="chrome">Chrome</option>
            <option value="edge">Edge</option>
            <option value="firefox">Firefox</option>
            <option value="brave">Brave</option>
            <option value="opera">Opera</option>
            <option value="vivaldi">Vivaldi</option>
            <option value="safari">Safari</option>
          </select>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
            {t('useCookiesWarn')}
          </p>
        </div>
      </section>

      {/* Clipboard */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('clipboardSec')}
        </p>
        <div className="toggle-wrap">
          <div>
            <p style={{ fontSize: 13 }}>{t('autoDetect')}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {t('autoDetectDesc')}
            </p>
          </div>
          <Toggle
            checked={settings.clipboardWatcher}
            onChange={(v) => {
              updateSettings({ clipboardWatcher: v })
              window.api.toggleClipboard(v)
            }}
          />
        </div>
      </section>

      {/* Presets */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <p className="heading-sm">{t('presetsSec')}</p>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: 12 }}
            onClick={() => setShowPresetForm(!showPresetForm)}
          >
            {showPresetForm ? t('cancelBtn') : t('addPreset')}
          </button>
        </div>

        {showPresetForm && (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 8
            }}
          >
            <div className="flex gap-8" style={{ marginBottom: 10 }}>
              <input
                className="input"
                style={{ width: 60, textAlign: 'center' }}
                value={presetForm.emoji}
                onChange={(e) => setPresetForm((p) => ({ ...p, emoji: e.target.value }))}
                placeholder="Emoji"
              />
              <input
                className="input flex-1"
                value={presetForm.name}
                onChange={(e) => setPresetForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Preset Name (e.g. Podcast Audio)"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    display: 'block',
                    marginBottom: 6
                  }}
                >
                  FORMAT
                </label>
                <select
                  className="input"
                  value={presetForm.format}
                  onChange={(e) =>
                    setPresetForm((p) => ({ ...p, format: e.target.value as MediaFormat }))
                  }
                >
                  <option value="audio">Audio only</option>
                  <option value="video">Video only</option>
                  <option value="audio+video">Audio + Video</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    display: 'block',
                    marginBottom: 6
                  }}
                >
                  AUDIO
                </label>
                <select
                  className="input"
                  value={presetForm.audioQuality}
                  onChange={(e) =>
                    setPresetForm((p) => ({ ...p, audioQuality: e.target.value as AudioQuality }))
                  }
                >
                  <option value="best">Best</option>
                  <option value="320k">320kbps</option>
                  <option value="128k">128kbps</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    display: 'block',
                    marginBottom: 6
                  }}
                >
                  VIDEO
                </label>
                <select
                  className="input"
                  value={presetForm.videoQuality}
                  onChange={(e) =>
                    setPresetForm((p) => ({ ...p, videoQuality: e.target.value as VideoQuality }))
                  }
                >
                  <option value="best">Best</option>
                  <option value="2160p">4K (2160p)</option>
                  <option value="1080p">FHD (1080p)</option>
                  <option value="720p">HD (720p)</option>
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 12, width: '100%', fontSize: 12, padding: '8px 0' }}
              onClick={() => {
                if (!presetForm.name.trim()) return
                const newPreset = {
                  id: window.api.generateId(),
                  name: presetForm.name,
                  emoji: presetForm.emoji || '⚡',
                  options: {
                    format: presetForm.format,
                    audioQuality: presetForm.audioQuality,
                    videoQuality: presetForm.videoQuality
                  }
                }
                updateSettings({ presets: [...settings.presets, newPreset] })
                setShowPresetForm(false)
                setPresetForm({
                  name: '',
                  emoji: '🔥',
                  format: 'audio+video',
                  audioQuality: 'best',
                  videoQuality: '1080p'
                })
              }}
            >
              {t('savePreset')}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {settings.presets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
              {t('noPresets')}
            </p>
          ) : (
            settings.presets.map((preset) => (
              <div
                key={preset.id}
                className="flex justify-between items-center"
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: 6
                }}
              >
                <div>
                  <span style={{ marginRight: 8, fontSize: 18 }}>{preset.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{preset.name}</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                    {preset.options.format} • Audio: {preset.options.audioQuality} • Video:{' '}
                    {preset.options.videoQuality}
                  </p>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={() =>
                    updateSettings({ presets: settings.presets.filter((p) => p.id !== preset.id) })
                  }
                >
                  {t('deleteBtn')}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Advanced */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('advancedSec')}
        </p>
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              color: 'var(--text-secondary)',
              fontSize: 11,
              display: 'block',
              marginBottom: 6
            }}
          >
            {t('customArgs')}
          </label>
          <input
            className="input"
            value={settings.customArgs}
            onChange={(e) => updateSettings({ customArgs: e.target.value })}
            placeholder="--proxy socks5://127.0.0.1:1080"
          />
        </div>
        <div className="toggle-wrap">
          <div>
            <p style={{ fontSize: 13 }}>{t('portableMode')}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {t('portableModeDesc')}
            </p>
          </div>
          <Toggle
            checked={settings.portableMode}
            onChange={(v) => updateSettings({ portableMode: v })}
          />
        </div>
      </section>

      {/* Binaries */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('componentsSec')}
        </p>
        {binaryStatus && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="flex items-center gap-8">
              <span className={`badge ${binaryStatus.ytdlp ? 'badge-done' : 'badge-error'}`}>
                yt-dlp {binaryStatus.ytdlp ? '✓' : '✗'}
              </span>
              {binaryStatus.ytdlpVersion && (
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {binaryStatus.ytdlpVersion}
                </span>
              )}
            </div>
            <div className="flex items-center gap-8">
              <span className={`badge ${binaryStatus.ffmpeg ? 'badge-done' : 'badge-error'}`}>
                ffmpeg {binaryStatus.ffmpeg ? '✓' : '✗'}
              </span>
              {binaryStatus.ffmpegVersion && (
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {binaryStatus.ffmpegVersion}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-12">
          <button className="btn btn-ghost" onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? t('updating') : t('checkForUpdates')}
          </button>
          {updateMsg && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{updateMsg}</span>
          )}
        </div>
      </section>
    </div>
  )
}

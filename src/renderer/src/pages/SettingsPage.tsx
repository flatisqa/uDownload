import { useEffect, useState, type ReactElement } from 'react'
import { useStore } from '../store'
import type { MediaFormat, AudioQuality, VideoQuality, AppConfig } from '@shared/types/download'
import { useTranslation } from '../i18n'

function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}): ReactElement {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  )
}

export default function SettingsPage(): ReactElement {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const t = useTranslation(settings.language)

  const [binaryStatus, setBinaryStatus] = useState<{
    ytdlp: boolean
    ytdlpVersion?: string
    ffmpeg: boolean
    ffmpegVersion?: string
  } | null>(null)
  const [showArgsTooltip, setShowArgsTooltip] = useState(false)
  const [argsTooltipPinned, setArgsTooltipPinned] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [customSubLang, setCustomSubLang] = useState(false)

  const [showPresetForm, setShowPresetForm] = useState(false)
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
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

  const handleUpdate = async (): Promise<void> => {
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
              onChange={(e) => updateSettings({ theme: e.target.value as AppConfig['theme'] })}
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
            style={{
              width: '100%',
              ['--range-pct' as string]: `${((settings.concurrentDownloads - 1) / 4) * 100}%`
            }}
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
            <div className="toggle-wrap">
              <span style={{ fontSize: 13 }}>{t('embedLyrics')}</span>
              <Toggle
                checked={settings.embedLyrics}
                onChange={(v) => updateSettings({ embedLyrics: v })}
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
              {!customSubLang ? (
                <select
                  className="input"
                  value={
                    [
                      'orig',
                      'en',
                      'ru',
                      'es',
                      'fr',
                      'de',
                      'ja',
                      'ko',
                      'zh',
                      'ar',
                      'pt',
                      'it'
                    ].includes(settings.subtitleLanguage)
                      ? settings.subtitleLanguage
                      : 'other'
                  }
                  onChange={(e) => {
                    if (e.target.value === 'other') {
                      setCustomSubLang(true)
                    } else {
                      updateSettings({ subtitleLanguage: e.target.value })
                    }
                  }}
                >
                  <option value="orig">{t('subsLangOrig')}</option>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                  <option value="ar">العربية</option>
                  <option value="pt">Português</option>
                  <option value="it">Italiano</option>
                  <option value="other">{t('subsLangOther')}</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={settings.subtitleLanguage}
                    onChange={(e) => updateSettings({ subtitleLanguage: e.target.value })}
                    placeholder={t('subsLangPlaceholder')}
                    autoFocus
                  />
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '0 12px', fontSize: 12 }}
                    onClick={() => {
                      setCustomSubLang(false)
                      updateSettings({ subtitleLanguage: 'orig' })
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  marginTop: 8,
                  lineHeight: 1.6
                }}
              >
                {t('subsLangInfo')}
              </p>
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

        {/* Cookies */}
        <div style={{ marginTop: 16 }}>
          <label
            style={{ color: 'var(--text-secondary)', fontSize: 11, display: 'block', marginBottom: 4 }}
          >
            {t('useCookies')}
          </label>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
            {t('cookiesDesc')}
          </p>

          {/* From browser */}
          <label style={{ color: 'var(--text-secondary)', fontSize: 11, display: 'block', marginBottom: 6 }}>
            {t('useCookiesBrowserLabel')}
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
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, marginBottom: 14, lineHeight: 1.5 }}>
            {t('useCookiesWarn')}
          </p>

          {/* From file */}
          <label style={{ color: 'var(--text-secondary)', fontSize: 11, display: 'block', marginBottom: 8 }}>
            {t('cookiesFileLabel')}
          </label>
          <div
            style={{
              border: settings.cookiesFilePath
                ? '1px solid var(--border-active)'
                : '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-overlay)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            {/* File status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>
                {settings.cookiesFilePath ? '✅' : '📄'}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: settings.cookiesFilePath ? 'var(--text-primary)' : 'var(--text-muted)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {settings.cookiesFilePath
                  ? settings.cookiesFilePath.split(/[\\/]/).pop() || settings.cookiesFilePath
                  : t('cookiesFileNone')}
              </span>
            </div>
            {/* Buttons row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost"
                onClick={async () => {
                  const res = await window.api.openTxtFileDialog()
                  if (res.success && res.data) updateSettings({ cookiesFilePath: res.data })
                }}
              >
                {t('cookiesFileBtn')}
              </button>
              {settings.cookiesFilePath && (
                <button
                  className="btn btn-danger"
                  onClick={() => updateSettings({ cookiesFilePath: '' })}
                >
                  {t('cookiesFileClear')}
                </button>
              )}
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            {t('cookiesFileHint')}
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
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
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
          {!showPresetForm && (
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 12 }}
              onClick={() => setShowPresetForm(true)}
            >
              {t('addPreset')}
            </button>
          )}
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  presetForm.format === 'audio+video' ? '1fr 1fr 1fr' : '1fr 1fr',
                gap: 12
              }}
            >
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
              {presetForm.format !== 'video' && (
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
                    <option value="flac">FLAC (Lossless)</option>
                    <option value="320k">320kbps (MP3)</option>
                    <option value="256k">256kbps (MP3)</option>
                    <option value="192k">192kbps (MP3)</option>
                    <option value="128k">128kbps (MP3)</option>
                    <option value="96k">96kbps (MP3)</option>
                    <option value="opus">Opus</option>
                    <option value="aac">AAC</option>
                  </select>
                </div>
              )}
              {presetForm.format !== 'audio' && (
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
                    <option value="4320p">8K (4320p)</option>
                    <option value="2160p">4K (2160p)</option>
                    <option value="1440p">2K (1440p)</option>
                    <option value="1080p">FHD (1080p)</option>
                    <option value="720p">HD (720p)</option>
                    <option value="480p">SD (480p)</option>
                    <option value="360p">360p</option>
                    <option value="240p">240p</option>
                    <option value="144p">144p</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: 12, padding: '8px 0' }}
                onClick={() => {
                  setShowPresetForm(false)
                  setEditingPresetId(null)
                  setPresetForm({
                    name: '',
                    emoji: '🔥',
                    format: 'audio+video',
                    audioQuality: 'best',
                    videoQuality: '1080p'
                  })
                }}
              >
                {t('cancelBtn')}
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, fontSize: 12, padding: '8px 0' }}
                onClick={() => {
                  if (!presetForm.name.trim()) return
                  if (editingPresetId) {
                    // Editing existing preset
                    updateSettings({
                      presets: settings.presets.map((p) =>
                        p.id === editingPresetId
                          ? {
                            ...p,
                            name: presetForm.name,
                            emoji: presetForm.emoji || '⚡',
                            options: {
                              format: presetForm.format,
                              audioQuality: presetForm.audioQuality,
                              videoQuality: presetForm.videoQuality
                            }
                          }
                          : p
                      )
                    })
                  } else {
                    // Creating new preset
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
                  }
                  setShowPresetForm(false)
                  setEditingPresetId(null)
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
          </div>
        )}

        <div className="flex flex-col gap-16">
          {settings.presets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>
              {t('noPresets')}
            </p>
          ) : (
            settings.presets.map((preset) => {
              const presetFormat = preset.options.format || 'audio+video'
              const audioQuality = preset.options.audioQuality || 'best'
              const videoQuality = preset.options.videoQuality || 'best'

              return (
                <div key={preset.id} className="preset-card flex justify-between items-center">
                  <div>
                    <span style={{ marginRight: 8, fontSize: 18 }}>{preset.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{preset.name}</span>
                    <p
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        marginTop: 6,
                        lineHeight: 1.5
                      }}
                    >
                      {presetFormat}
                      {presetFormat !== 'video' && ` • Audio: ${audioQuality}`}
                      {presetFormat !== 'audio' && ` • Video: ${videoQuality}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => {
                        setEditingPresetId(preset.id)
                        setPresetForm({
                          name: preset.name,
                          emoji: preset.emoji,
                          format: preset.options.format || 'audio+video',
                          audioQuality: preset.options.audioQuality || 'best',
                          videoQuality: preset.options.videoQuality || '1080p'
                        })
                        setShowPresetForm(true)
                      }}
                    >
                      {t('editBtn')}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() =>
                        updateSettings({
                          presets: settings.presets.filter((p) => p.id !== preset.id)
                        })
                      }
                    >
                      {t('deleteBtn')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Advanced */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('advancedSec')}
        </p>
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6
            }}
          >
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                display: 'block'
              }}
            >
              {t('customArgs')}
            </label>
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '1.5px solid var(--accent)',
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
                onClick={() => {
                  setArgsTooltipPinned(!argsTooltipPinned)
                  setShowArgsTooltip(!argsTooltipPinned)
                }}
                onMouseEnter={(e) => {
                  if (!argsTooltipPinned) setShowArgsTooltip(true)
                  e.currentTarget.style.backgroundColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--bg)'
                }}
                onMouseLeave={(e) => {
                  if (!argsTooltipPinned) setShowArgsTooltip(false)
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
              >
                i
              </div>
              {showArgsTooltip && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: '100%',
                    marginBottom: 8,
                    padding: 18,
                    minWidth: 520,
                    maxWidth: 620,
                    zIndex: 1000,
                    fontSize: 13,
                    lineHeight: 1.8
                  }}
                  onMouseEnter={() => {
                    if (!argsTooltipPinned) setShowArgsTooltip(true)
                  }}
                  onMouseLeave={() => {
                    if (!argsTooltipPinned) setShowArgsTooltip(false)
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: 12,
                      fontSize: 14
                    }}
                  >
                    {t('customArgsInfo')}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
                    {t('customArgsExamples')
                      .split('\n\n')[0]
                      .split('\n')
                      .map((line, i) => (
                        <div key={i} style={{ marginBottom: i === 0 ? 4 : 2 }}>
                          {line}
                        </div>
                      ))}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {settings.language === 'ru' ? 'Полный список' : 'Full list'}:{' '}
                    <a
                      href="https://github.com/yt-dlp/yt-dlp#usage-and-options"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontSize: 13,
                        transition: 'opacity 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      github.com/yt-dlp/yt-dlp#usage-and-options
                    </a>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#fbbf24',
                      fontStyle: 'italic',
                      opacity: 0.9
                    }}
                  >
                    {t('customArgsTooltip')}
                  </div>
                </div>
              )}
            </div>
          </div>
          <input
            className="input"
            value={settings.customArgs}
            onChange={(e) => updateSettings({ customArgs: e.target.value })}
            placeholder="--proxy socks5://127.0.0.1:1080"
          />
        </div>
        {/* Portable mode - hidden until implemented
        <div className="toggle-wrap">
          <div>
            <p style={{ fontSize: 13 }}>{t('portableMode')}</p>
            <p
              style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}
            >
              {t('portableModeDesc')}
            </p>
          </div>
          <Toggle
            checked={settings.portableMode}
            onChange={(v) => updateSettings({ portableMode: v })}
          />
        </div>
        */}
      </section>

      {/* Binaries */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <p className="heading-sm" style={{ marginBottom: 16 }}>
          {t('componentsSec')}
        </p>
        <div className="toggle-wrap" style={{ marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13 }}>{t('autoCheckUpdates')}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
              {t('autoCheckUpdatesDesc')}
            </p>
          </div>
          <Toggle
            checked={settings.autoCheckUpdates}
            onChange={(v) => updateSettings({ autoCheckUpdates: v })}
          />
        </div>
        {binaryStatus && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="flex items-center gap-8">
              <span className={`badge ${binaryStatus.ytdlp ? 'badge-done' : 'badge-error'}`}>
                yt-dlp {binaryStatus.ytdlp ? '✓' : '✗'}
              </span>
              {binaryStatus.ytdlpVersion && (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {binaryStatus.ytdlpVersion}
                </span>
              )}
            </div>
            <div className="flex items-center gap-8">
              <span className={`badge ${binaryStatus.ffmpeg ? 'badge-done' : 'badge-error'}`}>
                ffmpeg {binaryStatus.ffmpeg ? '✓' : '✗'}
              </span>
              {binaryStatus.ffmpegVersion && (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
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

import { useCallback, useEffect, useRef } from 'react'
import type {
  DownloadOptions,
  MediaFormat,
  AudioQuality,
  VideoQuality,
  Preset
} from '@shared/types/download'
import { useStore } from '../store'
import { useTranslation } from '../i18n'

const getRecommendedMp3Quality = (kbps?: number): string | null => {
  if (!kbps) return null
  if (kbps > 280) return '320k'
  if (kbps > 224) return '256k'
  if (kbps > 160) return '192k'
  if (kbps > 112) return '128k'
  return '96k'
}

interface DownloaderPageProps {
  onGoToSettings?: () => void
  onGoToQueue?: () => void
  onGoToMetaEditor?: () => void
}

export default function DownloaderPage({
  onGoToSettings,
  onGoToQueue,
  onGoToMetaEditor
}: DownloaderPageProps): React.ReactNode {
  // Global downloader state
  const url = useStore((s) => s.url)
  const setUrl = useStore((s) => s.setUrl)

  const step = useStore((s) => s.step)
  const setStep = useStore((s) => s.setStep)

  const meta = useStore((s) => s.meta)
  const setMeta = useStore((s) => s.setMeta)

  const error = useStore((s) => s.error)
  const setError = useStore((s) => s.setError)

  const format = useStore((s) => s.format)
  const setFormat = useStore((s) => s.setFormat)

  const audioQuality = useStore((s) => s.audioQuality)
  const setAudioQuality = useStore((s) => s.setAudioQuality)

  const videoQuality = useStore((s) => s.videoQuality)
  const setVideoQuality = useStore((s) => s.setVideoQuality)

  const selectedPlaylistItems = useStore((s) => s.selectedPlaylistItems)
  const setSelectedPlaylistItems = useStore((s) => s.setSelectedPlaylistItems)

  const selectedChapters = useStore((s) => s.selectedChapters)
  const setSelectedChapters = useStore((s) => s.setSelectedChapters)

  const timeFrom = useStore((s) => s.timeFrom)
  const setTimeFrom = useStore((s) => s.setTimeFrom)

  const timeTo = useStore((s) => s.timeTo)
  const setTimeTo = useStore((s) => s.setTimeTo)
  const chapterMode = useStore((s) => s.chapterMode)
  const setChapterMode = useStore((s) => s.setChapterMode)

  const customTitle = useStore((s) => s.customTitle)
  const setCustomTitle = useStore((s) => s.setCustomTitle)
  const customThumbnail = useStore((s) => s.customThumbnail)
  const customArtist = useStore((s) => s.customArtist)
  const setCustomArtist = useStore((s) => s.setCustomArtist)
  const customYear = useStore((s) => s.customYear)
  const setCustomYear = useStore((s) => s.setCustomYear)
  const customDescription = useStore((s) => s.customDescription)
  const setCustomDescription = useStore((s) => s.setCustomDescription)

  const resetDownloader = useStore((s) => s.resetDownloader)

  const inputRef = useRef<HTMLInputElement>(null)
  const handleFetchRef = useRef<((url?: string) => Promise<void>) | null>(null)

  const settings = useStore((s) => s.settings)
  const addJob = useStore((s) => s.addJob)
  const t = useTranslation(settings.language)

  // Clipboard watcher event
  useEffect(() => {
    const unsub = window.api.onClipboardLink((detected) => {
      setUrl(detected)
      if (handleFetchRef.current) {
        handleFetchRef.current(detected)
      }
    })
    return unsub
  }, [setUrl])

  const handleFetch = useCallback(
    async (urlToFetch = url): Promise<void> => {
      if (!urlToFetch.trim()) return
      setStep('fetching')
      setError('')
      setMeta(null)
      try {
        const res = await window.api.fetchMetadata(
          urlToFetch.trim(),
          settings.cookiesFromBrowser,
          settings.cookiesManual,
          settings.cookiesFilePath
        )
        if (res.success && res.data) {
          setMeta(res.data)
          setCustomTitle(res.data.title)
          setSelectedPlaylistItems(
            res.data.playlistItems ? res.data.playlistItems.map((i) => i.id) : []
          )
          setSelectedChapters([])
          setTimeFrom('')
          setTimeTo('')
          setCustomArtist(res.data.author || '')
          setCustomYear(res.data.uploadDate ? res.data.uploadDate.substring(0, 4) : '')
          setCustomDescription(res.data.description || '')
          setStep('preview')
        } else {
          setError(res.error || 'Failed to fetch metadata')
          setStep('idle')
        }
      } catch (e) {
        setError(String(e))
        setStep('idle')
      }
    },
    [
      url,
      settings.cookiesFromBrowser,
      settings.cookiesManual,
      settings.cookiesFilePath,
      setStep,
      setError,
      setMeta,
      setCustomTitle,
      setSelectedPlaylistItems,
      setSelectedChapters,
      setTimeFrom,
      setTimeTo,
      setCustomArtist,
      setCustomYear,
      setCustomDescription
    ]
  )

  useEffect(() => {
    handleFetchRef.current = handleFetch
  }, [handleFetch])

  // Auto-fetch when URL in store changes (e.g. from Toast or external source)
  useEffect(() => {
    if (url && step === 'idle' && !meta) {
      handleFetch(url)
    }
  }, [url, step, meta, handleFetch])

  const handleDownload = async (): Promise<void> => {
    if (!meta) return

    const baseOptions: DownloadOptions = {
      format,
      audioQuality,
      videoQuality,
      outputPath:
        format === 'audio' ? settings.outputDirectoryAudio : settings.outputDirectoryVideo,
      downloadSubtitles: settings.downloadSubtitles,
      embedSubtitles: settings.embedSubtitles,
      subtitleLanguage: settings.subtitleLanguage,
      embedLyrics: settings.embedLyrics,
      embedThumbnail: settings.embedThumbnail,
      embedMetadata: settings.embedMetadata,
      cookiesFromBrowser: settings.cookiesFromBrowser,
      cookiesManual: settings.cookiesManual,
      cookiesFilePath: settings.cookiesFilePath,
      playlistAll: meta.isPlaylist
        ? selectedPlaylistItems.length === (meta.playlistItems?.length || 0)
        : true,
      selectedPlaylistItems: meta.isPlaylist ? selectedPlaylistItems : undefined,
      timeFrom: timeFrom.trim() || undefined,
      timeTo: timeTo.trim() || undefined,
      customArgs: settings.customArgs,
      customTitle: customTitle.trim() || undefined,
      customThumbnail: customThumbnail || undefined,
      customArtist: customArtist.trim() || undefined,
      customYear: customYear.trim() || undefined,
      customDescription: customDescription.trim() || undefined
    }

    // Determine final output path and if we need folders
    const albumFolderName = (customTitle || meta.title).replace(/[\\/:*?"<>|]/g, '_').trim()
    const albumFolderPath = `${baseOptions.outputPath}/${albumFolderName}`
    const isMultiChapter = chapterMode === 'selected' && selectedChapters.length > 1

    // For single chapter: check if album folder already exists (from previous chapter downloads)
    const albumFolderExists =
      !isMultiChapter && selectedChapters.length === 1
        ? await window.api.pathExists(albumFolderPath)
        : false

    const useAlbumFolder = isMultiChapter || albumFolderExists
    const finalOutputPath = useAlbumFolder ? albumFolderPath : baseOptions.outputPath

    // If we have manual chapter selections AND mode is 'selected', we split them into separate jobs.
    if (chapterMode === 'selected' && selectedChapters.length > 0 && !meta.isPlaylist) {
      for (const chapterKey of selectedChapters) {
        const chapterInfo = meta.chapters?.find((c) => `${c.startTime}-${c.endTime}` === chapterKey)
        const chapterIndex =
          meta.chapters?.findIndex((c) => `${c.startTime}-${c.endTime}` === chapterKey) ?? -1

        const chapterDuration = chapterInfo
          ? chapterInfo.endTime - chapterInfo.startTime
          : undefined

        // Add numerical prefix to chapter title for sorting, e.g. "001 - Chapter Title"
        const prefix = chapterIndex >= 0 ? `${String(chapterIndex + 1).padStart(3, '0')} - ` : ''
        const chapterRawTitle = chapterInfo?.title || chapterKey
        const numberedChapterTitle = `${prefix}${chapterRawTitle}`

        // Use full title for UI list, but short title for filename if in subfolder
        const displayTitle = chapterInfo
          ? `${customTitle || meta.title} - ${numberedChapterTitle}`
          : customTitle || meta.title

        // If saving to album folder (multi or existing folder), use short chapter title for filename
        const chapterTitle = useAlbumFolder ? numberedChapterTitle : displayTitle

        const chapterOptions: DownloadOptions = {
          ...baseOptions,
          outputPath: finalOutputPath,
          selectedChapters: [chapterKey],
          customTitle: chapterTitle,
          expectedDuration: chapterDuration
        }

        const res = await window.api.startDownload(meta.url, chapterOptions)
        if (res.success && res.data) {
          addJob({
            id: res.data,
            url: meta.url,
            metadata: {
              ...meta,
              title: displayTitle,
              thumbnail: customThumbnail || meta.thumbnail
            },
            options: chapterOptions,
            status: 'pending',
            progress: 0,
            createdAt: Date.now()
          })
        }
      }

      if (onGoToQueue) onGoToQueue()
      resetDownloader()
      setStep('idle')
      return
    }

    // Standard case: Single job (Standard download)
    const options: DownloadOptions = {
      ...baseOptions,
      selectedChapters: undefined
    }

    setStep('downloading')
    const res = await window.api.startDownload(meta.url, options)
    if (res.success && res.data) {
      addJob({
        id: res.data,
        url: meta.url,
        metadata: {
          ...meta,
          title: customTitle || meta.title,
          thumbnail: customThumbnail || meta.thumbnail
        },
        options,
        status: 'pending',
        progress: 0,
        createdAt: Date.now()
      })
      if (onGoToQueue) {
        onGoToQueue()
      }
      resetDownloader()
    } else {
      setError(res.error || 'Failed to start download')
      setStep('preview')
    }
  }

  const applyPreset = (preset: Preset): void => {
    if (preset.options.format) setFormat(preset.options.format)
    if (preset.options.audioQuality) setAudioQuality(preset.options.audioQuality)
    if (preset.options.videoQuality) setVideoQuality(preset.options.videoQuality)
  }

  const formatDuration = (secs: number): string => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="heading-xl">{t('navDownloader')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 12 }}>
            {t('waitingPlaceholder')}
          </p>
        </div>
      </div>

      {/* URL Input */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div className="flex gap-8">
          <div className="input-wrap flex-1">
            <input
              ref={inputRef}
              className="input"
              placeholder={t('urlPlaceholder')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              style={{ fontSize: 13 }}
            />
          </div>
          <button
            className="btn btn-ghost"
            onClick={resetDownloader}
            disabled={!url && !meta}
            style={{ padding: '0 16px', fontSize: 13, gap: 6 }}
          >
            <span style={{ fontSize: 16 }}>✕</span> {t('configClear')}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleFetch()}
            disabled={!url.trim() || step === 'fetching'}
          >
            {step === 'fetching' ? (
              '…'
            ) : (
              <>
                <span style={{ fontSize: 18 }}>⚡</span> {t('fetchBtn')}
              </>
            )}
          </button>
          {meta && step !== 'downloading' && (
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              style={{ background: 'var(--accent)', color: '#08090d', fontWeight: 700 }}
            >
              <span style={{ fontSize: 18 }}>⬇</span> {t('downloadBtn')}
            </button>
          )}
        </div>

        {error &&
          (error.includes('Sign in to confirm') ||
            error.includes("Sign in to confirm you're not a bot") ? (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8
              }}
            >
              <div className="flex items-center gap-12" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>🤖</span>
                <div>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--status-error)',
                      margin: 0
                    }}
                  >
                    Требуется авторизация YouTube (Защита от ботов)
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    YouTube заблокировал загрузку, так как считает этот запрос подозрительным. Чтобы
                    обойти это, необходимо использовать cookies из вашего браузера.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{
                  fontSize: 12,
                  padding: '6px 16px',
                  background: 'var(--status-error)',
                  borderColor: 'var(--status-error)'
                }}
                onClick={() => onGoToSettings && onGoToSettings()}
              >
                <span style={{ fontSize: 16 }}>⚙️</span>{' '}
                {t('settingsBtn') || 'Выбрать браузер в Настройках'}
              </button>
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                borderLeft: '3px solid var(--status-error)'
              }}
            >
              <p
                style={{
                  color: 'var(--status-error)',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4
                }}
              >
                Произошла ошибка:
              </p>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  wordBreak: 'break-all',
                  maxHeight: 100,
                  overflowY: 'auto'
                }}
              >
                {error}
              </p>
            </div>
          ))}
      </div>

      {/* Loading state */}
      {step === 'fetching' && (
        <div
          className="glass-panel"
          style={{
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            minHeight: 200
          }}
        >
          <div className="spinner-ring" />
          <div style={{ textAlign: 'center' }}>
            <p className="heading-sm" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>
              {t('analyzingLink')}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6 }}>
              {t('analyzingDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Video Preview Card */}
      {step === 'preview' && meta && (
        <div className="flex flex-col gap-24">
          <div
            className="glass-panel"
            style={{
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
            onClick={() => onGoToMetaEditor?.()}
          >
            <div className="flex gap-16">
              {(customThumbnail || meta.thumbnail) && (
                <div style={{ position: 'relative' }}>
                  <img
                    src={customThumbnail ? `file://${customThumbnail}` : meta.thumbnail}
                    alt={meta.title}
                    style={{
                      width: 140,
                      height: 90,
                      objectFit: 'cover',
                      borderRadius: 8,
                      flexShrink: 0
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.6)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 8,
                      color: 'white',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    ✎ EDIT
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-8 flex-1" style={{ minWidth: 0 }}>
                <div className="flex items-start justify-between gap-8">
                  <h2 className="heading-lg truncate flex-1">{customTitle || meta.title}</h2>
                  <button
                    className="btn btn-ghost"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      height: 'auto',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onGoToMetaEditor?.()
                    }}
                  >
                    <span style={{ fontSize: 14 }}>✎</span> {t('editMetadataBtn')}
                  </button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{meta.author}</p>
                <div className="flex gap-8 items-center" style={{ marginTop: 4 }}>
                  {meta.duration > 0 && (
                    <span className="badge badge-pending">{formatDuration(meta.duration)}</span>
                  )}
                  {meta.isPlaylist && (
                    <span className="badge badge-download">
                      Playlist · {meta.playlistItems?.length} tracks
                    </span>
                  )}
                  {(meta.chapters?.length ?? 0) > 0 && (
                    <span className="badge badge-convert">{meta.chapters?.length} chapters</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Presets */}
          {settings.presets.length > 0 && (
            <div>
              <p className="heading-sm" style={{ marginBottom: 10 }}>
                {t('configPreset')}
              </p>
              <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                {settings.presets.map((p) => (
                  <button key={p.id} className="btn btn-ghost" onClick={() => applyPreset(p)}>
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Config Panel */}
          <div className="glass-panel" style={{ padding: 20 }}>
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
                  {t('configFormat')}
                </label>
                <select
                  className="input"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as MediaFormat)}
                >
                  <option value="audio">Audio only</option>
                  <option value="video">Video only</option>
                  <option value="audio+video">Audio + Video</option>
                </select>
              </div>
              {(format === 'audio' || format === 'audio+video') && (
                <div>
                  <label
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      display: 'block',
                      marginBottom: 6
                    }}
                  >
                    {t('configAudio')}
                  </label>
                  <select
                    className="input"
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(e.target.value as AudioQuality)}
                  >
                    <optgroup label="── Оригинал ──">
                      <option value="best">⭐ Best (без изменений)</option>
                    </optgroup>
                    <optgroup label="── Lossless ──">
                      <option value="flac">FLAC (без потерь)</option>
                    </optgroup>
                    <optgroup label="── MP3 (с потерями) ──">
                      <option value="320k">
                        MP3 · 320 kbps
                        {getRecommendedMp3Quality(meta?.originalAudioBitrate) === '320k'
                          ? ' ✨ (Оптимально)'
                          : ''}
                      </option>
                      <option value="256k">
                        MP3 · 256 kbps
                        {getRecommendedMp3Quality(meta?.originalAudioBitrate) === '256k'
                          ? ' ✨ (Оптимально)'
                          : ''}
                      </option>
                      <option value="192k">
                        MP3 · 192 kbps
                        {getRecommendedMp3Quality(meta?.originalAudioBitrate) === '192k'
                          ? ' ✨ (Оптимально)'
                          : ''}
                      </option>
                      <option value="128k">
                        MP3 · 128 kbps
                        {getRecommendedMp3Quality(meta?.originalAudioBitrate) === '128k'
                          ? ' ✨ (Оптимально)'
                          : ''}
                      </option>
                      <option value="96k">
                        MP3 · 96 kbps
                        {getRecommendedMp3Quality(meta?.originalAudioBitrate) === '96k'
                          ? ' ✨ (Оптимально)'
                          : ''}
                      </option>
                    </optgroup>
                    <optgroup label="── Другие кодеки ──">
                      <option value="opus">Opus (эффективный)</option>
                      <option value="aac">AAC (для Apple)</option>
                    </optgroup>
                  </select>

                  {meta?.originalAudioBitrate && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span style={{ fontSize: 14 }}>🎵</span>
                      <span>
                        Оригинальный битрейт аудио: ~<b>{meta.originalAudioBitrate} kbps</b>
                      </span>
                    </div>
                  )}

                  {(audioQuality === '320k' ||
                    audioQuality === '256k' ||
                    audioQuality === '192k' ||
                    audioQuality === '128k' ||
                    audioQuality === '96k') && (
                      <p
                        style={{
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          marginTop: 5,
                          lineHeight: 1.4
                        }}
                      >
                        ℹ️ Выбор более высокого bitrate не улучшит качество. Если исходник был в{' '}
                        {meta?.originalAudioBitrate ? `${meta.originalAudioBitrate}k` : '128k'} — он
                        останется{' '}
                        {meta?.originalAudioBitrate ? `${meta.originalAudioBitrate}k` : '128k'}.
                        Перекодирование в 320k лишь увеличит размер файла.
                      </p>
                    )}
                  {audioQuality === 'best' && (
                    <p
                      style={{
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        marginTop: 5,
                        lineHeight: 1.4
                      }}
                    >
                      ✅ Best скачивает в Opus — родном формате YouTube. Никакого перекодирования,
                      оригинальное качество. Файл будет меньше MP3, а качество выше. (⚠️ Обложки и
                      теги не встраиваются)
                    </p>
                  )}
                  {(audioQuality === 'flac' ||
                    audioQuality === 'opus' ||
                    audioQuality === 'aac') && (
                      <p
                        style={{
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          marginTop: 5,
                          lineHeight: 1.4
                        }}
                      >
                        ⚠️ Для форматов FLAC, Opus, AAC и Ogg обложки и метаданные не встраиваются.
                        Выбирайте MP3, если вам нужны обложки в файле.
                      </p>
                    )}
                </div>
              )}
              {(format === 'video' || format === 'audio+video') && (
                <div>
                  <label
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      display: 'block',
                      marginBottom: 6
                    }}
                  >
                    {t('configVideo')}
                  </label>
                  <select
                    className="input"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value as VideoQuality)}
                  >
                    <option value="best">⭐ Best (максимальное)</option>
                    <option value="4320p">8K (4320p)</option>
                    <option value="2160p">4K (2160p)</option>
                    <option value="1440p">QHD (1440p)</option>
                    <option value="1080p">FHD (1080p)</option>
                    <option value="720p">HD (720p)</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                    <option value="240p">240p</option>
                    <option value="144p">144p (мин.)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Playlist Items */}
          {meta.isPlaylist && meta.playlistItems && meta.playlistItems.length > 0 && (
            <div className="glass-panel" style={{ padding: 20 }}>
              <p className="heading-sm" style={{ marginBottom: 12 }}>
                {t('playlistTracks')}
              </p>
              <div className="flex gap-8 items-center" style={{ marginBottom: 12 }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={() => setSelectedPlaylistItems(meta.playlistItems!.map((i) => i.id))}
                >
                  {t('selectAll')}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={() => setSelectedPlaylistItems([])}
                >
                  {t('selectNone')}
                </button>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {selectedPlaylistItems.length} selected
                </span>
              </div>
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  paddingRight: 8
                }}
              >
                {meta.playlistItems.map((item, idx) => (
                  <label
                    key={item.id}
                    className="flex gap-8 items-center"
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlaylistItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedPlaylistItems([...selectedPlaylistItems, item.id])
                        else
                          setSelectedPlaylistItems(
                            selectedPlaylistItems.filter((id) => id !== item.id)
                          )
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>{idx + 1}.</span>
                    <span className="truncate flex-1">{item.title}</span>
                    {item.duration > 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Chapters */}
          {!meta.isPlaylist && meta.chapters && meta.chapters.length > 0 && (
            <div className="glass-panel" style={{ padding: 20 }}>
              <p className="heading-sm" style={{ marginBottom: 12 }}>
                {t('chaptersTitle')}
              </p>

              <div className="flex gap-16" style={{ marginBottom: 16 }}>
                <label className="flex gap-8 items-center cursor-pointer" style={{ fontSize: 13 }}>
                  <input
                    type="radio"
                    name="chapterMode"
                    checked={chapterMode === 'single'}
                    onChange={() => setChapterMode('single')}
                  />
                  <span>{t('chapterOptionSingle')}</span>
                </label>
                <label className="flex gap-8 items-center cursor-pointer" style={{ fontSize: 13 }}>
                  <input
                    type="radio"
                    name="chapterMode"
                    checked={chapterMode === 'selected'}
                    onChange={() => setChapterMode('selected')}
                  />
                  <span>{t('chapterOptionSplit')}</span>
                </label>
              </div>

              <div
                className="flex items-center justify-between"
                style={{
                  marginBottom: 12,
                  opacity: chapterMode === 'single' ? 0.3 : 1,
                  pointerEvents: chapterMode === 'single' ? 'none' : 'auto'
                }}
              >
                <div className="flex gap-8 items-center">
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    onClick={() =>
                      setSelectedChapters(meta.chapters!.map((c) => `${c.startTime}-${c.endTime}`))
                    }
                  >
                    {t('selectAll')}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    onClick={() => setSelectedChapters([])}
                  >
                    {t('selectNone')}
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {selectedChapters.length} {t('selected')}
                  </span>
                </div>
              </div>

              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  paddingRight: 8,
                  opacity: chapterMode === 'single' ? 0.2 : 1,
                  pointerEvents: chapterMode === 'single' ? 'none' : 'auto'
                }}
              >
                {meta.chapters.map((chap, idx) => (
                  <label
                    key={idx}
                    className="flex gap-8 items-center"
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChapters.includes(`${chap.startTime}-${chap.endTime}`)}
                      onChange={(e) => {
                        const tId = `${chap.startTime}-${chap.endTime}`
                        if (e.target.checked) setSelectedChapters([...selectedChapters, tId])
                        else setSelectedChapters(selectedChapters.filter((t) => t !== tId))
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)', minWidth: 40 }}>
                      {formatDuration(chap.startTime)}
                    </span>
                    <span className="truncate flex-1">{chap.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Timing Crop */}
          {!meta.isPlaylist && (
            <div className="glass-panel" style={{ padding: 20 }}>
              <p className="heading-sm" style={{ marginBottom: 12 }}>
                {t('timingCrop')}
              </p>
              <div className="flex gap-16">
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      display: 'block',
                      marginBottom: 6
                    }}
                  >
                    {t('timeFrom')}
                  </label>
                  <input
                    className="input"
                    placeholder="00:00:00"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      display: 'block',
                      marginBottom: 6
                    }}
                  >
                    {t('timeTo')}
                  </label>
                  <input
                    className="input"
                    placeholder="inf"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                  />
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
                {t('timeHelper')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {step === 'idle' && !error && (
        <div className="empty-state" style={{ flex: 1, justifyContent: 'center', gap: 32 }}>
          <div className="empty-icon">⬆</div>
          <p className="heading-sm" style={{ marginBottom: 0 }}>
            {t('waitingPlaceholder')}
          </p>

          {/* Supported platforms */}
          <div className="platforms-grid">
            {[
              {
                name: 'YouTube',
                color: '#FF0000',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                )
              },
              {
                name: 'TikTok',
                color: '#69C9D0',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                )
              },
              {
                name: 'Instagram',
                color: '#E1306C',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                )
              },
              {
                name: 'Twitter / X',
                color: '#1DA1F2',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )
              },
              {
                name: 'Twitch',
                color: '#9146FF',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                  </svg>
                )
              },
              {
                name: 'SoundCloud',
                color: '#FF5500',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1.175 12.225C.511 12.225 0 12.737 0 13.413v.237c0 .675.511 1.188 1.175 1.188.663 0 1.175-.513 1.175-1.188v-.237c0-.676-.512-1.188-1.175-1.188zm2.213-.875c-.513 0-.925.4-.925.913v2.475c0 .512.412.912.925.912.512 0 .925-.4.925-.912V12.263c0-.513-.413-.913-.925-.913zm2.3-.35c-.513 0-.925.4-.925.913v3.15c0 .512.412.912.925.912.512 0 .925-.4.925-.912v-3.15c0-.513-.413-.913-.925-.913zm2.213.35c-.513 0-.925.4-.925.913v2.475c0 .512.412.912.925.912.512 0 .925-.4.925-.912V12.263c0-.513-.412-.913-.925-.913zm2.175-.875c-.513 0-.95.438-.95.963v3.15c0 .525.437.963.95.963.512 0 .95-.438.95-.963v-3.15c0-.525-.438-.963-.95-.963zm2.212-3.5c-1.85 0-3.362 1.412-3.5 3.237-.475-.387-1.075-.625-1.725-.625-1.475 0-2.675 1.175-2.675 2.638S7.325 15.1 8.8 15.1c.25 0 .5-.038.737-.1.275.513.8.875 1.413.875.675 0 1.25-.413 1.537-1.012.45.262.962.412 1.5.412 1.575 0 2.85-1.275 2.85-2.85 0-.113-.013-.225-.025-.337A4.01 4.01 0 0 0 18.35 7.9c.038-.2.05-.4.05-.6 0-2.2-1.787-3.988-3.988-3.988-.8 0-1.55.238-2.175.638-.575-1.05-1.7-1.775-3 -1.775z" />
                  </svg>
                )
              },
              {
                name: 'Vimeo',
                color: '#1AB7EA',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.832.462 2.916.782 4.73.961 5.435.533 2.414 1.12 3.62 1.76 3.62.496 0 1.242-.786 2.24-2.358 1-.573 1.57-2.173 1.708-2.358.151-.Sets.4-1 1.003-1.247.603-.247 1.306-.104 2.109.43 1.409.995 2.129 2.493 2.162 4.492-.033-.022.017-.057.017-.08z" />
                  </svg>
                )
              },
              {
                name: 'VK',
                color: '#4680C2',
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.032-1.01-1.484-.9-1.9-.9-.78 0-.98.197-.98 1.333v1.543c0 .953-.302 1.52-2.79 1.52-4.11 0-8.669-2.604-11.86-7.486C1.313 9.41.07 6.824.07 4.356c0-.659.197-.98 1.333-.98h1.744c1.01 0 1.394.46 1.784 1.543 1.963 5.67 5.25 10.64 6.6 10.64.51 0 .74-.24.74-1.564v-2.445c-.165-2.806-1.643-3.04-1.643-4.047 0-.495.404-.989 1.049-.989h2.733c.898 0 1.213.476 1.213 1.497v3.294c0 .912.393 1.237.63 1.237.51 0 .937-.325 1.873-1.26 2.9-3.241 4.966-8.232 4.966-8.232.275-.659.83-.989 1.543-.989h1.744c1.022 0 1.244.525.835 1.238-.795 1.566-5.42 8.978-5.42 8.978-1.322 1.956-1.322 2.062 0 3.975z" />
                  </svg>
                )
              }
            ].map((p) => (
              <div key={p.name} className="platform-chip" title={p.name}>
                <div className="platform-chip-icon" style={{ color: p.color }}>
                  {p.icon}
                </div>
                <span className="platform-chip-name">{p.name}</span>
              </div>
            ))}
          </div>
          <p className="platforms-caption">
            yt-dlp поддерживает <strong>1000+</strong> сервисов
          </p>
        </div>
      )}
    </div>
  )
}

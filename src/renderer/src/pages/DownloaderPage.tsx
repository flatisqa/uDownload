import { useCallback, useEffect, useState } from 'react'
import type {
  DownloadOptions,
  DownloadTrackSection,
  PlaylistProgress
} from '@shared/types/download'
import { useStore } from '../store'
import { useTranslation } from '../i18n'
import { UrlInputPanel } from '../components/Downloader/UrlInputPanel'
import { VideoPreviewCard } from '../components/Downloader/VideoPreviewCard'
import { FormatConfigPanel } from '../components/Downloader/FormatConfigPanel'
import { PlaylistPanel } from '../components/Downloader/PlaylistPanel'
import { ChaptersPanel } from '../components/Downloader/ChaptersPanel'
import { TimingPanel } from '../components/Downloader/TimingPanel'
import { TrackSplitPanel } from '../components/Downloader/TrackSplitPanel'
import { EmptyState } from '../components/Downloader/EmptyState'
import { ConfirmConflictModal, ConflictInfo } from '../components/Downloader/ConfirmConflictModal'

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
  const step = useStore((s) => s.step)
  const setStep = useStore((s) => s.setStep)

  const meta = useStore((s) => s.meta)
  const setMeta = useStore((s) => s.setMeta)

  const setError = useStore((s) => s.setError)

  const format = useStore((s) => s.format)
  const audioQuality = useStore((s) => s.audioQuality)
  const videoQuality = useStore((s) => s.videoQuality)

  const selectedPlaylistItems = useStore((s) => s.selectedPlaylistItems)
  const setSelectedPlaylistItems = useStore((s) => s.setSelectedPlaylistItems)

  const selectedChapters = useStore((s) => s.selectedChapters)
  const setSelectedChapters = useStore((s) => s.setSelectedChapters)

  const timeFrom = useStore((s) => s.timeFrom)
  const setTimeFrom = useStore((s) => s.setTimeFrom)

  const timeTo = useStore((s) => s.timeTo)
  const setTimeTo = useStore((s) => s.setTimeTo)
  const chapterMode = useStore((s) => s.chapterMode)

  const customTitle = useStore((s) => s.customTitle)
  const setCustomTitle = useStore((s) => s.setCustomTitle)
  const customThumbnail = useStore((s) => s.customThumbnail)
  const customArtist = useStore((s) => s.customArtist)
  const setCustomArtist = useStore((s) => s.setCustomArtist)
  const customYear = useStore((s) => s.customYear)
  const setCustomYear = useStore((s) => s.setCustomYear)
  const customDescription = useStore((s) => s.customDescription)
  const setCustomDescription = useStore((s) => s.setCustomDescription)
  const detectedTracks = useStore((s) => s.detectedTracks)

  const resetDownloader = useStore((s) => s.resetDownloader)

  const settings = useStore((s) => s.settings)
  const addJob = useStore((s) => s.addJob)
  const t = useTranslation(settings.language)

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

  // Auto-fetch when URL in store changes (e.g. from Toast or external source)
  useEffect(() => {
    if (url && step === 'idle' && !meta) {
      handleFetch(url)
    }
  }, [url, step, meta, handleFetch])

  const [conflict, setConflict] = useState<ConflictInfo | null>(null)

  const handleDownload = async (ignoreConflict: boolean | unknown = false): Promise<void> => {
    if (!meta) return

    const force = ignoreConflict === true

    const isPlaylist = Boolean(meta.isPlaylist)
    const rawOutputPath =
      (format === 'audio'
        ? settings.outputDirectoryAudio
        : settings.outputDirectoryVideo || settings.outputDirectoryAudio) || ''
    const baseOutputPath = rawOutputPath.trim().replace(/\/+$/, '')
    const albumFolderName = (customTitle || meta.title).replace(/[\\/:*?"<>|]/g, '_').trim()
    const albumFolderPath = baseOutputPath
      ? `${baseOutputPath}/${albumFolderName}`
      : albumFolderName
    const isMultiChapter = chapterMode === 'selected' && selectedChapters.length > 1
    const selectedDetectedTracks = detectedTracks.filter((t) => t.selected)
    const isMultiDetected = selectedDetectedTracks.length > 1

    if (!force) {
      const isFolderCheck = isPlaylist || isMultiChapter || isMultiDetected
      const singleTrackTitle =
        chapterMode === 'selected' && selectedChapters.length === 1
          ? meta.chapters
              ?.find((c) => selectedChapters.includes(`${c.startTime}-${c.endTime}`))
              ?.title.replace(/^\d+[\s\-–—.:)]+/, '')
              .trim()
          : selectedDetectedTracks.length === 1
            ? selectedDetectedTracks[0].title.replace(/^\d+[\s\-–—.:)]+/, '').trim()
            : customTitle || meta.title
      const titleToCheck = isFolderCheck ? albumFolderName : singleTrackTitle || customTitle || meta.title
      try {
        const conflictCheck = await window.api.checkConflict(
          baseOutputPath,
          titleToCheck,
          isFolderCheck,
          format
        )
        if (conflictCheck && conflictCheck.exists) {
          setConflict(conflictCheck)
          return
        }
      } catch (err) {
        console.error('Failed to check conflict:', err)
      }
    }

    const baseOptions: DownloadOptions = {
      format,
      audioQuality,
      videoQuality,
      outputPath: baseOutputPath,
      downloadSubtitles: settings.downloadSubtitles,
      embedSubtitles: settings.embedSubtitles,
      subtitleLanguage: settings.subtitleLanguage,
      embedLyrics: settings.embedLyrics,
      embedThumbnail: settings.embedThumbnail,
      embedMetadata: settings.embedMetadata,
      cookiesFromBrowser: settings.cookiesFromBrowser,
      cookiesManual: settings.cookiesManual,
      cookiesFilePath: settings.cookiesFilePath,
      playlistAll: isPlaylist
        ? selectedPlaylistItems.length === (meta.playlistItems?.length || 0)
        : true,
      selectedPlaylistItems: isPlaylist ? selectedPlaylistItems : undefined,
      timeFrom: timeFrom.trim() || undefined,
      timeTo: timeTo.trim() || undefined,
      customArgs: settings.customArgs,
      customTitle: isPlaylist ? undefined : customTitle.trim() || undefined,
      customThumbnail: isPlaylist ? undefined : customThumbnail || undefined,
      customArtist: customArtist.trim() || undefined,
      customYear: customYear.trim() || undefined,
      customDescription: customDescription.trim() || undefined
    }

    const finalOutputPath = isPlaylist ? albumFolderPath : baseOptions.outputPath

    // If we have manual chapter selections AND mode is 'selected', download as a single grouped album job
    if (chapterMode === 'selected' && selectedChapters.length > 0 && !meta.isPlaylist) {
      const selectedChapterInfos = (meta.chapters || [])
        .filter((c) => selectedChapters.includes(`${c.startTime}-${c.endTime}`))
        .sort((a, b) => a.startTime - b.startTime)

      if (selectedChapterInfos.length > 0) {
        const isSingleTrack = selectedChapterInfos.length === 1
        const trackSections: DownloadTrackSection[] = selectedChapterInfos.map((c, i) => {
          const prefix = isSingleTrack ? '' : `${String(i + 1).padStart(2, '0')}. `
          const cleanTitle = c.title.replace(/^\d+[\s\-–—.:)]+/, '').trim()
          const trackTitle = `${prefix}${cleanTitle}`
          const duration = Math.max(1, Math.round(c.endTime - c.startTime))
          return {
            title: trackTitle,
            startTime: c.startTime,
            endTime: c.endTime,
            duration
          }
        })

        const initialPlaylistProgress: PlaylistProgress = {
          current: 1,
          total: trackSections.length,
          items: trackSections.map((t, idx) => ({
            id: String(idx + 1),
            title: t.title,
            duration: t.duration,
            status: 'pending' as const,
            progress: 0
          }))
        }

        const albumOptions: DownloadOptions = {
          ...baseOptions,
          outputPath: isSingleTrack ? baseOutputPath : albumFolderPath,
          trackSections
        }

        setStep('downloading')
        const res = await window.api.startDownload(
          meta.url,
          albumOptions,
          initialPlaylistProgress,
          {
            ...meta,
            title: customTitle || meta.title,
            thumbnail: customThumbnail || meta.thumbnail
          }
        )
        if (res.success && res.data) {
          addJob({
            id: res.data,
            url: meta.url,
            metadata: {
              ...meta,
              title: customTitle || meta.title,
              thumbnail: customThumbnail || meta.thumbnail
            },
            options: albumOptions,
            status: 'pending',
            progress: 0,
            createdAt: Date.now(),
            playlistProgress: initialPlaylistProgress
          })
          if (onGoToQueue) onGoToQueue()
          resetDownloader()
          setStep('idle')
        } else {
          setError(res.error || 'Failed to start download')
          setStep('preview')
        }
        return
      }
    }

    // If we have detected tracks from silence/text splitting, download as a single grouped album job
    if (selectedDetectedTracks.length > 0 && !meta.isPlaylist) {
      const isSingleTrack = selectedDetectedTracks.length === 1
      const trackSections: DownloadTrackSection[] = selectedDetectedTracks.map((track, i) => {
        const prefix = isSingleTrack ? '' : `${String(i + 1).padStart(2, '0')}. `
        const cleanTitle = track.title.replace(/^\d+[\s\-–—.:)]+/, '').trim()
        const trackTitle = `${prefix}${cleanTitle}`
        return {
          title: trackTitle,
          startTime: track.startTime,
          endTime: track.endTime,
          duration: track.duration
        }
      })

      const initialPlaylistProgress: PlaylistProgress = {
        current: 1,
        total: trackSections.length,
        items: trackSections.map((t, idx) => ({
          id: String(idx + 1),
          title: t.title,
          duration: t.duration,
          status: 'pending' as const,
          progress: 0
        }))
      }

      const multiTrackOptions: DownloadOptions = {
        ...baseOptions,
        outputPath: isSingleTrack ? baseOutputPath : albumFolderPath,
        trackSections
      }

      setStep('downloading')
      const res = await window.api.startDownload(
        meta.url,
        multiTrackOptions,
        initialPlaylistProgress,
        {
          ...meta,
          title: customTitle || meta.title,
          thumbnail: customThumbnail || meta.thumbnail
        }
      )
      if (res.success && res.data) {
        addJob({
          id: res.data,
          url: meta.url,
          metadata: {
            ...meta,
            title: customTitle || meta.title,
            thumbnail: customThumbnail || meta.thumbnail
          },
          options: multiTrackOptions,
          status: 'pending',
          progress: 0,
          createdAt: Date.now(),
          playlistProgress: initialPlaylistProgress
        })
        if (onGoToQueue) onGoToQueue()
        resetDownloader()
        setStep('idle')
      } else {
        setError(res.error || 'Failed to start download')
        setStep('preview')
      }
      return
    }

    // Standard case: Single job (Standard download)
    const options: DownloadOptions = {
      ...baseOptions,
      outputPath: finalOutputPath,
      selectedChapters: undefined
    }

    const playlistItemsToDownload =
      meta.isPlaylist && meta.playlistItems
        ? meta.playlistItems.filter((item) =>
            baseOptions.playlistAll ? true : selectedPlaylistItems.includes(item.id)
          )
        : []

    const initialPlaylistProgress =
      playlistItemsToDownload.length > 0
        ? {
            current: 0,
            total: playlistItemsToDownload.length,
            items: playlistItemsToDownload.map((item) => ({
              id: item.id,
              title: item.title,
              url: item.url,
              duration: item.duration,
              thumbnail: item.thumbnail,
              status: 'pending' as const,
              progress: 0
            }))
          }
        : undefined

    setStep('downloading')
    const res = await window.api.startDownload(meta.url, options, initialPlaylistProgress, {
      ...meta,
      title: customTitle || meta.title,
      thumbnail: customThumbnail || meta.thumbnail
    })
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
        createdAt: Date.now(),
        playlistProgress: initialPlaylistProgress
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
      <UrlInputPanel
        handleFetch={handleFetch}
        handleDownload={() => handleDownload(false)}
        onGoToSettings={onGoToSettings}
      />

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

      {/* Video Preview Card & Config */}
      {step === 'preview' && meta && (
        <div className="flex flex-col gap-24">
          <VideoPreviewCard onGoToMetaEditor={onGoToMetaEditor} />

          <FormatConfigPanel />
          <PlaylistPanel />
          <ChaptersPanel />
          <TimingPanel />
          <TrackSplitPanel onDownloadTracks={() => handleDownload(false)} />
        </div>
      )}

      {/* Empty state */}
      <EmptyState />

      {/* Conflict confirmation dialog */}
      {conflict && (
        <ConfirmConflictModal
          conflict={conflict}
          onConfirm={() => {
            setConflict(null)
            handleDownload(true)
          }}
          onCancel={() => setConflict(null)}
        />
      )}
    </div>
  )
}

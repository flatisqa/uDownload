import React from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'
import type { Preset, MediaFormat, AudioQuality, VideoQuality } from '@shared/types/download'

const getRecommendedMp3Quality = (kbps?: number): string | null => {
  if (!kbps) return null
  if (kbps >= 320) return '320k'
  if (kbps >= 256) return '256k'
  if (kbps >= 192) return '192k'
  if (kbps >= 128) return '128k'
  return '96k'
}

export const FormatConfigPanel: React.FC = () => {
  const settings = useStore((s) => s.settings)
  const format = useStore((s) => s.format)
  const setFormat = useStore((s) => s.setFormat)
  const audioQuality = useStore((s) => s.audioQuality)
  const setAudioQuality = useStore((s) => s.setAudioQuality)
  const videoQuality = useStore((s) => s.videoQuality)
  const setVideoQuality = useStore((s) => s.setVideoQuality)
  const meta = useStore((s) => s.meta)

  const t = useTranslation(settings.language)

  const applyPreset = (preset: Preset): void => {
    if (preset.options.format) setFormat(preset.options.format)
    if (preset.options.audioQuality) setAudioQuality(preset.options.audioQuality)
    if (preset.options.videoQuality) setVideoQuality(preset.options.videoQuality)
  }

  return (
    <>
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
              <option value="audio">{t('formatAudioOnly')}</option>
              <option value="video">{t('formatVideoOnly')}</option>
              <option value="audio+video">{t('formatAudioVideo')}</option>
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
                    {t('originalBitrateLabel')} ~<b>{meta.originalAudioBitrate} kbps</b>
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
                  {t('audioHintLossy')}
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
                  {t('audioHintBest')}
                </p>
              )}
              {(audioQuality === 'flac' || audioQuality === 'opus' || audioQuality === 'aac') && (
                <p
                  style={{
                    fontSize: 10,
                    color: 'var(--text-tertiary)',
                    marginTop: 5,
                    lineHeight: 1.4
                  }}
                >
                  {t('audioHintOther')}
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
    </>
  )
}

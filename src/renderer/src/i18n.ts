export type SupportedLanguage = 'en' | 'ru'

export const translations = {
  en: {
    // Navigation
    navDownloader: 'Downloader',
    navQueue: 'Queue',
    navSettings: 'Settings',

    // Downloader Page
    urlPlaceholder: 'Paste YouTube / VK / TikTok link...',
    fetchBtn: 'Fetch',
    configClear: 'Clear',
    waitingPlaceholder: 'Paste link to grab track or video',
    analyzingLink: 'Analyzing link...',
    analyzingDesc: 'Fetching video metadata',
    settingsBtn: 'Select browser in Settings',

    // Config Panel
    configFormat: 'FORMAT',
    configAudio: 'AUDIO',
    configVideo: 'VIDEO',
    configSubtitles: 'SUBTITLES',
    configSubtitlesNone: 'None',
    configSubtitlesDownload: 'Download',
    configSubtitlesEmbed: 'Embed',
    configChapters: 'CHAPTERS',
    configChaptersOption: 'Split by chapter',
    chapterOptionSingle: 'Single file (Full video)',
    chapterOptionSplit: 'Selected episodes',
    configAdvanced: 'ADVANCED',
    configPreset: 'FAST PRESET (SMART)',

    // Playlist & Chapters
    playlistTracks: 'Playlist Tracks',
    selectAll: 'Select All',
    selectNone: 'None',
    chaptersTitle: 'Chapters',
    timingCrop: 'Timing Crop (Optional)',
    timeFrom: 'FROM (HH:MM:SS)',
    timeTo: 'TO (HH:MM:SS)',
    timeHelper: 'Leave empty to download full video. Ignored if chapters are selected.',
    selected: 'selected',
    editMetadataBtn: 'Edit Metadata',
    metaArtist: 'Artist',
    metaYear: 'Year',
    metaDescription: 'Description / Comment',

    // Download BTN
    downloadBtn: '⬇ Download',

    // Queue Page
    queueTitle: 'Download Queue',
    queueEmpty: 'Queue is empty. Find something to download!',
    openFolder: 'Folder',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    removeBtn: 'Remove',
    clearFinished: 'Clear finished',
    activeJobs: 'active',
    finishedJobs: 'finished',
    noDownloads: 'No downloads',
    downloadedFileLabel: 'File',
    downloadedFormatLabel: 'Format',
    retryBtn: 'Retry',

    // Statuses
    statusIdle: 'Idle',
    statusFetching: 'Fetching...',
    statusPending: 'Pending',
    statusStarting: 'Preparing...',
    statusDownloading: 'Downloading',
    statusConverting: 'Processing...',
    statusDone: 'Done',
    statusError: 'Error',
    statusCancelled: 'Cancelled',
    statusPaused: 'Paused',

    // Settings Page
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    themeDeepSpace: 'Deep Space',
    themeLight: 'Light',
    themeMidnightPurple: 'Midnight Purple',
    themeCrimsonWave: 'Crimson Wave',
    themeArcticSteel: 'Arctic Steel',
    themeSunsetAmber: 'Sunset Amber',
    themeGraphitePro: 'Graphite Pro',
    themeSakuraRain: 'Sakura Rain',
    themeForestTerminal: 'Forest Terminal',
    themeSystem: 'System Default',

    downloadSec: 'Download',
    saveFolderVideo: 'VIDEO SAVE FOLDER',
    saveFolderAudio: 'AUDIO SAVE FOLDER',
    browse: 'Browse',
    concurrent: 'CONCURRENT DOWNLOADS',

    subtitlesSec: 'Subtitles & Lyrics',
    downloadSubs: 'Download subtitles / lyrics',
    embedSubs: 'Embed into video',
    embedLyrics: 'Embed lyrics into audio',
    subsLang: 'LANGUAGE',
    subsLangOrig: 'Original',
    subsLangOther: 'Other (custom code)',
    subsLangInfo:
      'Language codes: en (English), ru (Russian), es (Spanish), fr (French), de (German), ja (Japanese), ko (Korean), zh (Chinese), ar (Arabic), pt (Portuguese), it (Italian), etc.',
    subsLangPlaceholder: 'Enter language code (e.g., en, ru, es)...',

    metadataSec: 'Metadata & Tags',
    embedThumb: 'Embed thumbnail (album art)',
    embedMeta: 'Embed metadata (title, artist)',
    useCookies: 'COOKIES (BYPASS AGE / GEO BLOCKS)',
    cookiesDesc: 'Required only if the video is age-restricted, region-blocked, or needs you to be logged in.',
    useCookiesNone: 'None (public videos)',
    useCookiesWarn: 'Browser must be closed during download.',
    useCookiesBrowserLabel: 'FROM BROWSER',
    cookiesFileLabel: 'FROM FILE (cookies.txt)',
    cookiesFileBtn: 'Choose cookies.txt',
    cookiesFileNone: 'No file selected',
    cookiesFileClear: 'Remove',
    cookiesFileHint: 'Export cookies.txt from your browser using any "cookies export" extension, then select the file here.',

    clipboardSec: 'Clipboard Watcher',
    autoDetect: 'Auto-detect media links',
    autoDetectDesc: 'When enabled, copying a YouTube URL will prompt an instant download',

    presetsSec: 'Smart Presets',
    addPreset: '+ Add Preset',
    cancelBtn: 'Cancel',
    savePreset: 'Save Preset',
    noPresets: 'No presets yet.',
    editBtn: 'Edit',
    deleteBtn: 'Delete',

    advancedSec: 'Advanced',
    customArgs: 'CUSTOM yt-dlp ARGUMENTS',
    customArgsInfo: 'Additional yt-dlp options you can use',
    customArgsTooltip: 'Click to pin/unpin this tooltip',
    customArgsExamples:
      'Examples:\n• --proxy socks5://127.0.0.1:1080 (use proxy)\n• --limit-rate 1M (limit download speed)\n• --sleep-interval 5 (wait between downloads)\n• --geo-bypass (bypass geo-restrictions)\n• --format "bestvideo[height<=720]+bestaudio" (custom quality)\n• --write-description (save video description)\n• --write-info-json (save metadata as JSON)\n\nFull list: https://github.com/yt-dlp/yt-dlp#usage-and-options',
    portableMode: 'Portable mode',
    portableModeDesc: 'Save config.json next to the executable',

    componentsSec: 'Components',
    autoCheckUpdates: 'Check for updates on startup',
    autoCheckUpdatesDesc: 'Automatically check for yt-dlp and ffmpeg updates when app starts',
    checkForUpdates: '↻ Check for updates',
    updating: 'Updating...',

    // Clipboard Toast
    detectedLink: 'Detected media link',
    downloadNow: 'Download Now',
    dismiss: 'Dismiss',

    // Errors
    ytdlpUpdateRequired:
      'YouTube protection detected. Please update yt-dlp to the latest version in Settings → Components → Check for updates'
  },
  ru: {
    // Navigation
    navDownloader: 'Загрузки',
    navQueue: 'Очередь',
    navSettings: 'Настройки',

    // Downloader Page
    urlPlaceholder: 'Вставьте ссылку YouTube / VK / TikTok...',
    fetchBtn: 'Найти',
    configClear: 'Очистить',
    waitingPlaceholder: 'Вставьте ссылку для загрузки аудио или видео',
    analyzingLink: 'Анализ ссылки...',
    analyzingDesc: 'Получаем метаданные видео',
    settingsBtn: 'Выбрать браузер в Настройках',

    // Config Panel
    configFormat: 'ФОРМАТ',
    configAudio: 'АУДИО',
    configVideo: 'ВИДЕО',
    configSubtitles: 'СУБТИТРЫ',
    configSubtitlesNone: 'Нет',
    configSubtitlesDownload: 'Скачать',
    configSubtitlesEmbed: 'Встроить',
    configChapters: 'ЧАПТЕРЫ (ЭПИЗОДЫ)',
    configChaptersOption: 'Разрезать по эпизодам',
    chapterOptionSingle: 'Одним файлом (Полное видео)',
    chapterOptionSplit: 'Выбранные эпизоды',
    configAdvanced: 'ПРОДВИНУТЫЕ',
    configPreset: 'БЫСТРЫЕ ПРЕСЕТЫ',

    // Playlist & Chapters
    playlistTracks: 'Треки плейлиста',
    selectAll: 'Выбрать всё',
    selectNone: 'Ничего',
    chaptersTitle: 'Чаптеры (Эпизоды)',
    timingCrop: 'Обрезка по времени (Опционально)',
    timeFrom: 'ОТ (ЧЧ:ММ:СС)',
    timeTo: 'ДО (ЧЧ:ММ:СС)',
    timeHelper: 'Оставьте пустым для скачивания всего видео. Игнорируется, если выбраны чаптеры.',
    selected: 'выбрано',
    editMetadataBtn: 'Изменить метаданные',
    metaArtist: 'Исполнитель',
    metaYear: 'Год',
    metaDescription: 'Описание / Комментарий',

    // Download BTN
    downloadBtn: '⬇ Скачать',

    // Queue Page
    queueTitle: 'Очередь загрузок',
    queueEmpty: 'Очередь пуста. Найдите что-нибудь для загрузки!',
    openFolder: 'Открыть папку',
    pause: 'Пауза',
    resume: 'Пуск',
    cancel: 'Отмена',
    removeBtn: 'Удалить',
    clearFinished: 'Очистить завершенные',
    activeJobs: 'активных',
    finishedJobs: 'завершенных',
    noDownloads: 'Нет загрузок',
    downloadedFileLabel: 'Файл',
    downloadedFormatLabel: 'Формат',
    retryBtn: 'Повторить',

    // Statuses
    statusIdle: 'Ожидание',
    statusFetching: 'Получение...',
    statusPending: 'В очереди',
    statusStarting: 'Подготовка...',
    statusDownloading: 'Скачивание',
    statusConverting: 'Обработки...',
    statusDone: 'Готово',
    statusError: 'Ошибка',
    statusCancelled: 'Отменено',
    statusPaused: 'Пауза',

    // Settings Page
    settingsTitle: 'Настройки',
    appearance: 'Внешний вид',
    language: 'Язык',
    theme: 'Тема оформления',
    themeDeepSpace: 'Глубокий космос',
    themeLight: 'Светлая',
    themeMidnightPurple: 'Полуночный пурпур',
    themeCrimsonWave: 'Багровая волна',
    themeArcticSteel: 'Арктическая сталь',
    themeSunsetAmber: 'Закатный янтарный',
    themeGraphitePro: 'Профессиональный графит',
    themeSakuraRain: 'Дождь сакуры',
    themeForestTerminal: 'Лесной терминал',
    themeSystem: 'Системная',

    downloadSec: 'Загрузка',
    saveFolderVideo: 'ПАПКА СОХРАНЕНИЯ ВИДЕО',
    saveFolderAudio: 'ПАПКА СОХРАНЕНИЯ АУДИО',
    browse: 'Обзор',
    concurrent: 'ОДНОВРЕМЕННЫХ ЗАГРУЗОК',

    subtitlesSec: 'Субтитры и Текст песен',
    downloadSubs: 'Скачивать субтитры / текст песен',
    embedSubs: 'Встраивать в видео',
    embedLyrics: 'Встраивать текст в аудио',
    subsLang: 'ЯЗЫК СУБТИТРОВ',
    subsLangOrig: 'Оригинал',
    subsLangOther: 'Другой (свой код)',
    subsLangInfo:
      'Коды языков: en (английский), ru (русский), es (испанский), fr (французский), de (немецкий), ja (японский), ko (корейский), zh (китайский), ar (арабский), pt (португальский), it (итальянский) и т.д.',
    subsLangPlaceholder: 'Введите код языка (напр., en, ru, es)...',

    metadataSec: 'Метаданные и Теги',
    embedThumb: 'Встроить обложку (thumbnail)',
    embedMeta: 'Встроить метаданные (название, артист)',
    useCookies: 'COOKIES (ОБХОД БЛОКИРОВОК)',
    cookiesDesc: 'Нужны только если видео заблокировано в вашем регионе, требует входа в аккаунт или ограничено по возрасту.',
    useCookiesNone: 'Нет (публичные видео)',
    useCookiesWarn: 'Браузер должен быть закрыт во время скачивания.',
    useCookiesBrowserLabel: 'ИЗ БРАУЗЕРА',
    cookiesFileLabel: 'ИЗ ФАЙЛА (cookies.txt)',
    cookiesFileBtn: 'Выбрать cookies.txt',
    cookiesFileNone: 'Файл не выбран',
    cookiesFileClear: 'Сбросить',
    cookiesFileHint: 'Экспортируйте cookies.txt из браузера с помощью любого расширения «экспорт cookies», затем выберите файл здесь.',

    clipboardSec: 'Перехват буфера обмена',
    autoDetect: 'Автоопределение медиа ссылок',
    autoDetectDesc: 'Копирование URL автоматически предложит скачать файл',

    presetsSec: 'Умные Пресеты',
    addPreset: '+ Создать Пресет',
    cancelBtn: 'Отмена',
    savePreset: 'Сохранить Пресет',
    noPresets: 'Нет пресетов.',
    editBtn: 'Редактировать',
    deleteBtn: 'Удалить',

    advancedSec: 'Расширенные',
    customArgs: 'КАСТОМНЫЕ АРГУМЕНТЫ yt-dlp',
    customArgsInfo: 'Дополнительные опции yt-dlp, которые можно использовать',
    customArgsTooltip: 'Нажмите, чтобы закрепить/открепить подсказку',
    customArgsExamples:
      'Примеры:\n• --proxy socks5://127.0.0.1:1080 (использовать прокси)\n• --limit-rate 1M (ограничить скорость загрузки)\n• --sleep-interval 5 (пауза между загрузками)\n• --geo-bypass (обход гео-ограничений)\n• --format "bestvideo[height<=720]+bestaudio" (своё качество)\n• --write-description (сохранить описание видео)\n• --write-info-json (сохранить метаданные как JSON)\n\nПолный список: https://github.com/yt-dlp/yt-dlp#usage-and-options',
    portableMode: 'Портативный режим',
    portableModeDesc: 'Сохранять config.json рядом с .exe файлом',

    componentsSec: 'Компоненты',
    autoCheckUpdates: 'Проверка обновлений при запуске',
    autoCheckUpdatesDesc:
      'Автоматически проверять обновления yt-dlp и ffmpeg при запуске приложения',
    checkForUpdates: '↻ Проверить обновления',
    updating: 'Обновление...',

    // Clipboard Toast
    detectedLink: 'Обнаружена ссылка',
    downloadNow: 'Скачать сейчас',
    dismiss: 'Скрыть',

    // Errors
    ytdlpUpdateRequired:
      'Обнаружена защита YouTube. Пожалуйста, обновите yt-dlp до последней версии в Настройки → Компоненты → Проверить обновления'
  }
}

export function useTranslation(lang: SupportedLanguage) {
  return function t(key: keyof (typeof translations)['en']) {
    return translations[lang][key] || translations['en'][key]
  }
}

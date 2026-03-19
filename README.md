# uDowload

Простое приложение для скачивания видео и аудио с YouTube и других платформ.

## Что умеет

- Скачивать видео и аудио с YouTube, TikTok, Vimeo и 1000+ сайтов
- Выбирать качество: от 144p до 4K/8K
- Скачивать плейлисты целиком
- Обрезать видео по времени (00:01:23 - 00:03:45)
- Скачивать отдельные главы (chapters) из YouTube
- Конвертировать в MP3 с выбором битрейта
- Встраивать обложки и метаданные в файлы
- Скачивать субтитры на нужном языке
- Автоматически ловить ссылки из буфера обмена
- Сохранять свои настройки в пресеты

## Скачать

Готовые сборки: https://github.com/flatisqa/uDownload/releases

- **Windows**: `.exe` установщик
- **macOS**: `.dmg` образ  
- **Linux**: `.AppImage` или `.deb`

## Для разработчиков

Требуется Node.js 20+.

```bash
# Клонировать
git clone https://github.com/flatisqa/uDownload.git
cd uDownload

# Установить зависимости
npm install

# Запустить для разработки
npm run dev

# Собрать
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## Технологии

- Electron + React + TypeScript
- Vite для сборки
- yt-dlp — движок загрузок
- FFmpeg — обработка видео/аудио

## Лицензия

MIT

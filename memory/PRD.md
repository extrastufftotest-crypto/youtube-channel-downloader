# Tube/Batch — YouTube Channel Downloader (PRD)

## Problem Statement (original)
Full-stack web app to download all videos (including Shorts) from a YouTube channel. User pastes channel URL, app fetches entire video list with thumbnails / titles / hashtags / publish dates, and offers single-video download (MP4) plus bulk download (ZIP). Final-year project demo.

## Architecture
- **Frontend**: React 19 + Tailwind + shadcn + sonner (toasts) + lucide-react icons. Swiss Brutalism design (Chivo + IBM Plex Sans, red/klein blue accents, sharp 1px borders, `rounded-none`).
- **Backend**: FastAPI (Python) on :8001, all routes under `/api`. Uses `yt-dlp` for listing + downloading, `ffmpeg` installed for merge fallback.
- **DB**: MongoDB — `channels` collection caches fetched metadata (keyed by `channel_id`).

## User Personas
- Students / archivists wanting to back up a channel's catalog
- Content researchers analyzing a creator's Shorts/video hashtag trends

## Core Requirements (static)
1. Input YouTube channel URL (handle, /channel/ID, /c/name, or /user form)
2. Fetch all videos + Shorts (with pagination handled by yt-dlp)
3. Display in card grid: thumbnail, title, hashtags, publish date, duration, view count, type badge
4. Single video download (MP4)
5. Bulk download (ZIP, up to 30 at a time)
6. Search + filter (All / Videos / Shorts)
7. Error handling + loading states
8. Responsive UI

## Implementation Status (2026-02-xx — initial MVP)
- ✅ Hero landing with URL input + example channels
- ✅ POST /api/channel/fetch — yt-dlp flat-extract of /videos and /shorts tabs, up to 300 items, Mongo cache
- ✅ GET /api/channel/{id} — cached read
- ✅ GET /api/download?url= — streams MP4 (format: best single-file mp4 or itag 18 fallback)
- ✅ POST /api/download/bulk — downloads then ZIP-streams, cap 30
- ✅ ChannelHeader with stats (total/videos/shorts/subscribers)
- ✅ VideoGrid with card UI, individual checkbox, per-card MP4 download
- ✅ BulkBar with search, filter tabs, Select All (capped at 30), Clear, Download ZIP
- ✅ Toast feedback for all async actions
- ✅ All interactive elements have `data-testid`

## Tests
- 11/11 backend pytest tests pass (`/app/backend/tests/test_youtube_downloader.py`)
- Frontend end-to-end verified with @fireship channel (348 items loaded)

## Prioritized Backlog
### P0 (blocking quality)
- None right now

### P1 (strong upgrades)
- Progress streaming for bulk ZIP (SSE or chunked progress) — currently spinner only
- Parallel downloads with small worker pool (currently sequential)
- Per-video format selector (720p/1080p/audio-only)

### P2 (nice-to-have)
- Rate limiting on /api/channel/fetch and /api/download
- Full per-video hashtag extraction (second-pass extract_info)
- Export metadata-only CSV (no video download)
- Persistent "recent channels" history for quick re-open
- Auth + per-user download history

## Known Limitations
- Cap of 300 items per channel fetch for responsiveness
- Bulk ZIP capped at 30 to avoid timeouts
- Hashtags currently parsed from flat-extract (mostly titles); full description pass deferred
- FastAPI `@app.on_event` deprecated — works but should move to lifespan handlers

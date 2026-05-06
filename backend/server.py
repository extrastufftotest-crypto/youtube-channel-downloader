from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import uuid
import logging
import asyncio
import tempfile
import zipfile
import shutil
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import yt_dlp


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="YouTube Channel Downloader API")
api_router = APIRouter(prefix="/api")

# ---------- Helpers ----------
HASHTAG_RE = re.compile(r"#(\w{2,50})")
INVALID_CHARS_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def sanitize_filename(title: str) -> str:
    cleaned = INVALID_CHARS_RE.sub("", title or "").strip().replace("\n", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return (cleaned[:140] or "video")


def extract_hashtags(text: str) -> List[str]:
    if not text:
        return []
    return list(dict.fromkeys(HASHTAG_RE.findall(text)))[:15]


# ---------- Models ----------
class FetchRequest(BaseModel):
    url: str


class VideoItem(BaseModel):
    id: str
    title: str
    url: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    upload_date: Optional[str] = None
    view_count: Optional[int] = None
    hashtags: List[str] = []
    is_short: bool = False


class ChannelResponse(BaseModel):
    channel_id: str
    channel_name: str
    channel_url: str
    thumbnail: Optional[str] = None
    subscriber_count: Optional[int] = None
    description: Optional[str] = None
    video_count: int
    videos: List[VideoItem]


class BulkDownloadRequest(BaseModel):
    urls: List[str]
    channel_name: Optional[str] = "videos"


# ---------- yt-dlp sync helpers ----------
def _ydl_flat_opts() -> dict:
    return {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": "in_playlist",
        "skip_download": True,
        "ignoreerrors": True,
        "playlistend": 300,  # cap for demo responsiveness
    }


def _fetch_channel_sync(url: str) -> dict:
    u = url.strip().rstrip("/")
    # Build candidate URLs: main channel /videos + /shorts, or direct playlist/video link
    if "watch?v=" in u or "/playlist" in u:
        candidates = [u]
    elif "/videos" in u or "/shorts" in u or "/streams" in u:
        candidates = [u]
    else:
        candidates = [u + "/videos", u + "/shorts"]

    channel_info = None
    merged = {}
    for candidate in candidates:
        try:
            with yt_dlp.YoutubeDL(_ydl_flat_opts()) as ydl:
                info = ydl.extract_info(candidate, download=False)
        except Exception:
            continue
        if not info:
            continue
        if channel_info is None:
            channel_info = info
        is_short_section = "/shorts" in candidate
        for entry in info.get("entries", []) or []:
            if not entry:
                continue
            vid_id = entry.get("id")
            if not vid_id or vid_id in merged:
                continue
            merged[vid_id] = {**entry, "_is_short": is_short_section}

    if channel_info is None or not merged:
        raise ValueError("Could not fetch channel. Check that the URL is correct and public.")

    videos = []
    for vid_id, e in merged.items():
        thumbs = e.get("thumbnails") or []
        thumb = thumbs[-1]["url"] if thumbs else f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
        # yt-dlp flat extraction may use "duration" in seconds
        duration = e.get("duration")
        # Mark as short if yt-dlp says so OR duration <= 60
        is_short = bool(e.get("_is_short")) or (isinstance(duration, (int, float)) and duration and duration <= 60)
        videos.append({
            "id": vid_id,
            "title": e.get("title") or "Untitled",
            "url": f"https://www.youtube.com/watch?v={vid_id}",
            "thumbnail": thumb,
            "duration": int(duration) if duration else None,
            "view_count": e.get("view_count"),
            "upload_date": e.get("upload_date"),
            "hashtags": extract_hashtags(e.get("description") or e.get("title") or ""),
            "is_short": is_short,
        })

    channel_id = (
        channel_info.get("channel_id")
        or channel_info.get("uploader_id")
        or channel_info.get("id")
        or str(uuid.uuid4())
    )
    ch_thumbs = channel_info.get("thumbnails") or []
    ch_thumb = ch_thumbs[-1]["url"] if ch_thumbs else None

    return {
        "channel_id": channel_id,
        "channel_name": (
            channel_info.get("channel")
            or channel_info.get("uploader")
            or channel_info.get("title")
            or "Channel"
        ),
        "channel_url": channel_info.get("channel_url") or candidates[0],
        "thumbnail": ch_thumb,
        "subscriber_count": channel_info.get("channel_follower_count"),
        "description": channel_info.get("description"),
        "video_count": len(videos),
        "videos": videos,
    }


def _download_video_sync(url: str, out_dir: str) -> str:
    ydl_opts = {
        "outtmpl": os.path.join(out_dir, "%(title).100B.%(ext)s"),
        # Prefer a single mp4 file, fall back to itag 18 (360p mp4, always single-file)
        "format": "best[ext=mp4][vcodec!=none][acodec!=none]/18/best",
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "restrictfilenames": False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
    if not os.path.exists(filename):
        # Sometimes the file extension differs; find any file in dir
        files = [f for f in os.listdir(out_dir) if os.path.isfile(os.path.join(out_dir, f))]
        if files:
            filename = os.path.join(out_dir, files[0])
    return filename


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "YouTube Channel Downloader API", "status": "ok"}


@api_router.post("/channel/fetch", response_model=ChannelResponse)
async def fetch_channel(req: FetchRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    if "youtube.com" not in url and "youtu.be" not in url:
        raise HTTPException(status_code=400, detail="Please provide a valid YouTube URL")

    try:
        data = await asyncio.to_thread(_fetch_channel_sync, url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.exception("fetch_channel failed")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    doc = {**data, "_cached_at": datetime.now(timezone.utc).isoformat()}
    try:
        await db.channels.update_one(
            {"channel_id": data["channel_id"]},
            {"$set": doc},
            upsert=True,
        )
    except Exception:
        logging.exception("cache write failed")
    return data


@api_router.get("/channel/{channel_id}", response_model=ChannelResponse)
async def get_cached_channel(channel_id: str):
    doc = await db.channels.find_one(
        {"channel_id": channel_id}, {"_id": 0, "_cached_at": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Channel not cached")
    return doc


@api_router.get("/download")
async def download_single(url: str = Query(...)):
    if "youtube.com" not in url and "youtu.be" not in url:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    tmpdir = tempfile.mkdtemp(prefix="ytdl_")
    try:
        path = await asyncio.to_thread(_download_video_sync, url, tmpdir)
    except Exception as e:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Download failed: {str(e)}")

    if not os.path.exists(path):
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Downloaded file missing")

    safe_name = sanitize_filename(os.path.basename(path))
    # Ensure mp4 extension
    if not safe_name.lower().endswith((".mp4", ".webm", ".mkv")):
        safe_name += ".mp4"

    def iterfile():
        try:
            with open(path, "rb") as f:
                while True:
                    chunk = f.read(1024 * 64)
                    if not chunk:
                        break
                    yield chunk
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    return StreamingResponse(
        iterfile(),
        media_type="video/mp4",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


@api_router.post("/download/bulk")
async def download_bulk(req: BulkDownloadRequest):
    urls = [u for u in (req.urls or []) if u]
    if not urls:
        raise HTTPException(status_code=400, detail="No URLs provided")
    if len(urls) > 30:
        raise HTTPException(status_code=400, detail="Bulk limit is 30 videos per request")

    tmpdir = tempfile.mkdtemp(prefix="ytdl_bulk_")
    downloaded: List[str] = []

    async def download_all():
        for u in urls:
            try:
                p = await asyncio.to_thread(_download_video_sync, u, tmpdir)
                if os.path.exists(p):
                    downloaded.append(p)
            except Exception:
                logging.exception("bulk download item failed: %s", u)
                continue

    try:
        await download_all()
    except Exception as e:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

    if not downloaded:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=400, detail="None of the videos could be downloaded")

    zip_path = os.path.join(tmpdir, "videos.zip")

    def make_zip():
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_STORED, allowZip64=True) as zf:
            for p in downloaded:
                zf.write(p, arcname=sanitize_filename(os.path.basename(p)))
        return zip_path

    try:
        await asyncio.to_thread(make_zip)
    except Exception as e:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

    def iterzip():
        try:
            with open(zip_path, "rb") as f:
                while True:
                    chunk = f.read(1024 * 64)
                    if not chunk:
                        break
                    yield chunk
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    safe_zip_name = sanitize_filename(req.channel_name or "videos") + ".zip"
    return StreamingResponse(
        iterzip(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_zip_name}"'},
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

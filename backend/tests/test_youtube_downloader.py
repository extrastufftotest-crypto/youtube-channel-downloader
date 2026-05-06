"""Backend tests for YouTube Channel Downloader API"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://tube-batch-saver.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SHORT_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
CHANNEL_URL = "https://www.youtube.com/@fireship"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
def test_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    assert j.get("status") == "ok"


# ---------- Channel fetch ----------
@pytest.fixture(scope="module")
def channel_data(session):
    r = session.post(f"{API}/channel/fetch", json={"url": CHANNEL_URL}, timeout=300)
    assert r.status_code == 200, f"fetch failed: {r.status_code} {r.text[:300]}"
    return r.json()


def test_channel_fetch_valid(channel_data):
    d = channel_data
    assert d.get("channel_name")
    assert d.get("video_count", 0) > 0
    assert isinstance(d.get("videos"), list) and len(d["videos"]) > 0
    v = d["videos"][0]
    for k in ["id", "title", "url", "thumbnail", "hashtags", "is_short"]:
        assert k in v, f"missing {k}"
    assert any(v.get("is_short") for v in d["videos"]), "expected at least one short"


def test_channel_fetch_invalid_url(session):
    r = session.post(f"{API}/channel/fetch", json={"url": "https://google.com"})
    assert r.status_code == 400


def test_channel_fetch_empty_url(session):
    r = session.post(f"{API}/channel/fetch", json={"url": ""})
    assert r.status_code == 400


def test_get_cached_channel(session, channel_data):
    cid = channel_data["channel_id"]
    r = session.get(f"{API}/channel/{cid}")
    assert r.status_code == 200
    j = r.json()
    assert j["channel_id"] == cid
    assert j["video_count"] > 0


def test_get_cached_channel_not_found(session):
    r = session.get(f"{API}/channel/nonexistent_xyz_999")
    assert r.status_code == 404


# ---------- Single download ----------
def test_download_invalid_url(session):
    r = session.get(f"{API}/download", params={"url": "https://google.com"})
    assert r.status_code == 400


def test_download_single_headers(session):
    """Verify headers + small chunk only, then close to avoid full download."""
    with session.get(f"{API}/download", params={"url": SHORT_VIDEO_URL}, stream=True, timeout=300) as r:
        assert r.status_code == 200, f"download failed: {r.status_code} {r.text[:200]}"
        assert "video/mp4" in r.headers.get("Content-Type", "")
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd and "filename" in cd
        # Read a small chunk to confirm streaming works
        chunk = next(r.iter_content(chunk_size=4096), b"")
        assert chunk and len(chunk) > 0


# ---------- Bulk download ----------
def test_bulk_empty(session):
    r = session.post(f"{API}/download/bulk", json={"urls": []})
    assert r.status_code == 400


def test_bulk_too_many(session):
    urls = [SHORT_VIDEO_URL] * 31
    r = session.post(f"{API}/download/bulk", json={"urls": urls})
    assert r.status_code == 400


def test_bulk_two_videos_headers(session):
    urls = [SHORT_VIDEO_URL, "https://www.youtube.com/watch?v=jNQXAC9IVRw"]
    with session.post(f"{API}/download/bulk", json={"urls": urls}, stream=True, timeout=600) as r:
        assert r.status_code == 200, f"bulk failed: {r.status_code} {r.text[:200]}"
        assert "application/zip" in r.headers.get("Content-Type", "")
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd and ".zip" in cd
        chunk = next(r.iter_content(chunk_size=4096), b"")
        assert chunk and chunk[:2] == b"PK", "expected ZIP magic bytes"

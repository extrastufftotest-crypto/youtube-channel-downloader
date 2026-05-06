import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 300000, // 5 min for large channel fetches
});

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "--:--";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatViews(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export function formatUploadDate(d) {
  if (!d || d.length !== 8) return "—";
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
}

export function downloadSingle(videoUrl, title) {
  const url = `${API}/download?url=${encodeURIComponent(videoUrl)}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = (title || "video") + ".mp4";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

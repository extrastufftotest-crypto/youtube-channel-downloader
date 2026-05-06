import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import Hero from "../components/Hero";
import ChannelHeader from "../components/ChannelHeader";
import VideoGrid from "../components/VideoGrid";
import BulkBar from "../components/BulkBar";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | videos | shorts
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchChannel = async (e) => {
    e?.preventDefault?.();
    if (!url.trim()) {
      toast.error("Enter a YouTube channel URL");
      return;
    }
    setLoading(true);
    setChannel(null);
    setSelected(new Set());
    try {
      const { data } = await api.post("/channel/fetch", { url: url.trim() });
      setChannel(data);
      toast.success(`Loaded ${data.video_count} items from ${data.channel_name}`);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to fetch channel";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = (visibleIds) => {
    setSelected((prev) => {
      const capped = visibleIds.slice(0, 30);
      const allCappedSelected = capped.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allCappedSelected) {
        capped.forEach((id) => next.delete(id));
      } else {
        capped.forEach((id) => next.add(id));
      }
      return next;
    });
    if (visibleIds.length > 30) {
      toast.info("Selected first 30 items (ZIP limit per request)");
    }
  };

  const downloadBulk = async () => {
    if (!channel) return;
    const chosen = channel.videos.filter((v) => selected.has(v.id));
    if (!chosen.length) {
      toast.error("Select at least one video");
      return;
    }
    if (chosen.length > 30) {
      toast.error("Bulk limit is 30 videos. Deselect some.");
      return;
    }
    setBulkLoading(true);
    toast.info(`Packaging ${chosen.length} videos into a ZIP — this may take a while`);
    try {
      const res = await api.post(
        "/download/bulk",
        { urls: chosen.map((v) => v.url), channel_name: channel.channel_name },
        { responseType: "blob", timeout: 0 }
      );
      const blob = new Blob([res.data], { type: "application/zip" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${channel.channel_name.replace(/[^\w\-\. ]/g, "")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success("ZIP download started");
    } catch (err) {
      toast.error("Bulk download failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const filtered = channel
    ? channel.videos.filter((v) => {
        if (filter === "videos" && v.is_short) return false;
        if (filter === "shorts" && !v.is_short) return false;
        if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
    : [];

  return (
    <div className="min-h-screen relative">
      <TopBar />

      <main className="relative z-10">
        {!channel && (
          <Hero
            url={url}
            setUrl={setUrl}
            onSubmit={fetchChannel}
            loading={loading}
          />
        )}

        {loading && !channel && (
          <div
            className="fixed inset-0 bg-[#F2F2F2]/80 z-40 flex items-center justify-center"
            data-testid="loading-overlay"
          >
            <div className="bg-white border border-[#0A0A0A] p-8 brutal-shadow">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#002FA7]" />
                <div>
                  <div className="font-heading font-black uppercase tracking-tighter text-xl">
                    Scanning Channel
                  </div>
                  <div className="font-mono-plex text-xs text-[#555555] mt-1">
                    yt-dlp → parsing entries → extracting hashtags
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {channel && (
          <>
            <ChannelHeader
              channel={channel}
              onReset={() => {
                setChannel(null);
                setUrl("");
                setSelected(new Set());
              }}
            />
            <BulkBar
              total={channel.video_count}
              filteredCount={filtered.length}
              selectedCount={selected.size}
              onSelectAllVisible={() => selectAllVisible(filtered.map((v) => v.id))}
              onClearSelection={() => setSelected(new Set())}
              onBulkDownload={downloadBulk}
              bulkLoading={bulkLoading}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
            />
            <VideoGrid
              videos={filtered}
              selected={selected}
              onToggle={toggleSelect}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="sticky top-0 z-30 bg-white border-b border-[#0A0A0A]"
      data-testid="top-bar"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] grid place-items-center">
            <div className="w-3 h-3 bg-white" />
          </div>
          <div className="font-heading font-black uppercase tracking-tighter text-lg leading-none">
            Tube<span className="text-[#E63946]">/</span>Batch
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 font-mono-plex text-[11px] uppercase tracking-[0.25em] text-[#555555]">
          <span>v.02.2026</span>
          <span>//</span>
          <span className="text-[#0A0A0A]">YT-DLP · ENGINE</span>
          <span>//</span>
          <span className="text-[#002FA7]">FINAL YEAR PROJECT</span>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#0A0A0A] bg-white mt-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-heading font-black uppercase tracking-tighter text-3xl">
            Tube<span className="text-[#E63946]">/</span>Batch
          </div>
          <p className="mt-3 text-sm text-[#555555] max-w-xs">
            A high-contrast utility to archive YouTube channels, Shorts, and metadata.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555555] mb-3">
            Engine
          </div>
          <ul className="font-mono-plex text-sm space-y-1">
            <li>yt-dlp 2026.3</li>
            <li>FastAPI + MongoDB</li>
            <li>React 19 + Tailwind</li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555555] mb-3">
            Disclaimer
          </div>
          <p className="text-xs text-[#555555] leading-relaxed">
            For educational use. Respect YouTube&apos;s terms of service and creator
            copyrights. Download content only when you have the right to do so.
          </p>
        </div>
      </div>
      <div className="border-t border-[#0A0A0A]/15">
        <div className="marquee font-heading font-black uppercase tracking-tighter text-[72px] md:text-[120px] leading-none text-[#0A0A0A]/10 py-4 select-none">
          <span className="px-8">ARCHIVE EVERYTHING /</span>
          <span className="px-8">SHORTS + VIDEOS /</span>
          <span className="px-8">ZIP IT UP /</span>
          <span className="px-8">ARCHIVE EVERYTHING /</span>
          <span className="px-8">SHORTS + VIDEOS /</span>
          <span className="px-8">ZIP IT UP /</span>
        </div>
      </div>
    </footer>
  );
}

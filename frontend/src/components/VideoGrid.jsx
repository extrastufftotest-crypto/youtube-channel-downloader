import { useState } from "react";
import { Download, Play, Loader2, Check, Hash, Clock, Eye } from "lucide-react";
import { formatDuration, formatViews, formatUploadDate, downloadSingle } from "../lib/api";

export default function VideoGrid({ videos, selected, onToggle }) {
  if (!videos.length) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 text-center">
        <div className="font-heading font-black uppercase tracking-tighter text-4xl mb-2">
          No results
        </div>
        <div className="font-mono-plex text-sm text-[#555555]">
          Try clearing the search or changing the filter.
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-[1400px] mx-auto px-0 md:px-10 py-6" data-testid="video-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-l border-t border-[#0A0A0A]/15">
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            video={v}
            checked={selected.has(v.id)}
            onToggle={() => onToggle(v.id)}
          />
        ))}
      </div>
    </section>
  );
}

function VideoCard({ video, checked, onToggle }) {
  const [downloading, setDownloading] = useState(false);

  const handleSingle = async () => {
    setDownloading(true);
    try {
      downloadSingle(video.url, video.title);
      // We can't track browser download, just release after short delay
      setTimeout(() => setDownloading(false), 2500);
    } catch {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`relative bg-white border-r border-b border-[#0A0A0A]/15 flex flex-col group transition-colors ${
        checked ? "bg-[#FFF5F5]" : ""
      }`}
      data-testid={`video-card-${video.id}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black/5 border-b border-[#0A0A0A]/15 overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-200"
        />
        {/* Select checkbox */}
        <button
          onClick={onToggle}
          aria-label="Select video"
          className={`absolute top-2 left-2 w-7 h-7 border border-[#0A0A0A] flex items-center justify-center transition-colors ${
            checked ? "bg-[#E63946] text-white" : "bg-white hover:bg-[#F2F2F2]"
          }`}
          data-testid={`select-video-${video.id}`}
        >
          {checked && <Check className="w-4 h-4" />}
        </button>
        {/* Type badge */}
        {video.is_short ? (
          <span className="absolute top-2 right-2 bg-[#002FA7] text-white px-2 py-1 font-heading font-black uppercase text-[10px] tracking-widest">
            Short
          </span>
        ) : (
          <span className="absolute top-2 right-2 bg-[#0A0A0A] text-white px-2 py-1 font-heading font-black uppercase text-[10px] tracking-widest">
            Video
          </span>
        )}
        {/* Duration */}
        {video.duration ? (
          <span className="absolute bottom-2 right-2 bg-[#0A0A0A] text-white px-2 py-0.5 font-mono-plex text-xs">
            {formatDuration(video.duration)}
          </span>
        ) : null}
        {/* Play overlay */}
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity"
          aria-label="Open on YouTube"
        >
          <div className="bg-white border border-[#0A0A0A] p-3">
            <Play className="w-5 h-5 text-[#0A0A0A]" />
          </div>
        </a>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-grow">
        <h3
          className="font-bold text-[15px] leading-snug line-clamp-2 mb-2 min-h-[42px]"
          title={video.title}
        >
          {video.title}
        </h3>

        <div className="font-mono-plex text-[11px] text-[#555555] flex items-center gap-3 flex-wrap mb-3">
          {video.view_count ? (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {formatViews(video.view_count)}
            </span>
          ) : null}
          {video.upload_date ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatUploadDate(video.upload_date)}
            </span>
          ) : null}
        </div>

        {video.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {video.hashtags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="bg-[#F2F2F2] border border-[#0A0A0A]/10 text-[#555555] text-[10px] px-1.5 py-0.5 font-mono-plex flex items-center gap-0.5"
              >
                <Hash className="w-2.5 h-2.5" />
                {t}
              </span>
            ))}
            {video.hashtags.length > 4 && (
              <span className="text-[10px] text-[#555555] font-mono-plex px-1">
                +{video.hashtags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-2 flex gap-0">
          <button
            onClick={handleSingle}
            disabled={downloading}
            className="flex-1 bg-[#0A0A0A] text-white hover:bg-[#E63946] font-heading font-black uppercase text-xs tracking-wider py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            data-testid={`download-single-${video.id}`}
          >
            {downloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> MP4
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

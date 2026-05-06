import { X, Users, Film, ExternalLink } from "lucide-react";
import { formatViews } from "../lib/api";

export default function ChannelHeader({ channel, onReset }) {
  const shortsCount = channel.videos.filter((v) => v.is_short).length;
  const videosCount = channel.video_count - shortsCount;

  return (
    <section
      className="border-b border-[#0A0A0A] bg-white"
      data-testid="channel-header"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-12 border-x border-[#0A0A0A]">
        {/* Channel identity */}
        <div className="col-span-12 md:col-span-7 p-8 md:p-12 border-r border-[#0A0A0A] flex gap-6 items-start">
          {channel.thumbnail && (
            <img
              src={channel.thumbnail}
              alt={channel.channel_name}
              className="w-24 h-24 md:w-32 md:h-32 object-cover border border-[#0A0A0A] grayscale hover:grayscale-0 transition-all"
              data-testid="channel-thumbnail"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-mono-plex text-[11px] uppercase tracking-[0.3em] text-[#555555] mb-2">
              Channel Loaded
            </div>
            <h2
              className="font-heading font-black uppercase tracking-tighter text-3xl md:text-5xl leading-[0.9] break-words"
              data-testid="channel-name"
            >
              {channel.channel_name}
            </h2>
            <a
              href={channel.channel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 font-mono-plex text-xs text-[#002FA7] hover:text-[#E63946] transition-colors"
              data-testid="channel-external-link"
            >
              Open on YouTube <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={onReset}
            className="hidden md:flex items-center gap-2 px-4 py-2 border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white font-heading font-bold uppercase text-xs tracking-wider transition-colors"
            data-testid="reset-channel-btn"
          >
            <X className="w-4 h-4" /> New Channel
          </button>
        </div>

        {/* Stats */}
        <div className="col-span-12 md:col-span-5 grid grid-cols-3">
          <StatCell
            label="Total"
            value={channel.video_count}
            accent="#0A0A0A"
            testId="stat-total"
          />
          <StatCell
            label="Videos"
            value={videosCount}
            accent="#E63946"
            icon={<Film className="w-4 h-4" />}
            testId="stat-videos"
          />
          <StatCell
            label="Shorts"
            value={shortsCount}
            accent="#002FA7"
            icon={<Film className="w-4 h-4" />}
            testId="stat-shorts"
            last
          />
          {channel.subscriber_count ? (
            <div
              className="col-span-3 p-6 border-t border-[#0A0A0A] flex items-center justify-between bg-[#F2F2F2]"
              data-testid="subscribers-row"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#555555]">
                <Users className="w-4 h-4" /> Subscribers
              </div>
              <div className="font-heading font-black text-2xl">
                {formatViews(channel.subscriber_count)}
              </div>
            </div>
          ) : (
            <div className="col-span-3 p-6 border-t border-[#0A0A0A] bg-[#F2F2F2] font-mono-plex text-xs text-[#555555] text-center">
              Subscriber count unavailable
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCell({ label, value, accent, icon, testId, last }) {
  return (
    <div
      className={`p-6 flex flex-col justify-between min-h-[120px] ${
        last ? "" : "border-r border-[#0A0A0A]"
      }`}
      data-testid={testId}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#555555]">
        {icon}
        {label}
      </div>
      <div
        className="font-heading font-black text-4xl md:text-5xl leading-none"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}

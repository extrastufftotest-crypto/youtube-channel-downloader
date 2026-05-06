import { ArrowRight, Youtube, Loader2, Zap, Film, Download } from "lucide-react";

export default function Hero({ url, setUrl, onSubmit, loading }) {
  return (
    <section className="relative border-b border-[#0A0A0A]" data-testid="hero">
      {/* Asymmetric grid */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-0 border-x border-[#0A0A0A]">
        {/* Left column: headline + form */}
        <div className="col-span-12 lg:col-span-8 p-8 md:p-14 border-r border-[#0A0A0A]">
          <div className="font-mono-plex text-[11px] uppercase tracking-[0.3em] text-[#555555] flex items-center gap-3 mb-8">
            <span className="inline-block w-8 h-[2px] bg-[#E63946]" />
            <span>Section 01 — Archive Utility</span>
          </div>

          <h1
            className="font-heading font-black uppercase tracking-tighter leading-[0.9] text-[clamp(2.6rem,7vw,5.5rem)] text-[#0A0A0A]"
            data-testid="hero-title"
          >
            Rip an entire
            <br />
            <span className="text-[#E63946]">YouTube</span> channel.
            <br />
            Shorts, videos,
            <br />
            metadata. <span className="text-[#002FA7]">Done.</span>
          </h1>

          <p className="mt-8 max-w-xl text-base md:text-lg text-[#0A0A0A]/80 leading-relaxed">
            Paste a channel URL. Get every video and Short with thumbnails, titles,
            hashtags, and publish dates. Download individually or zip the entire
            archive in one click.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-10 flex flex-col sm:flex-row gap-0 border border-[#0A0A0A] bg-white brutal-shadow max-w-2xl"
            data-testid="channel-url-form"
          >
            <div className="flex items-center px-4 border-r border-[#0A0A0A] bg-[#F2F2F2]">
              <Youtube className="w-5 h-5 text-[#E63946]" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="youtube.com/@channelhandle"
              disabled={loading}
              className="flex-1 px-4 py-4 bg-white text-[#0A0A0A] placeholder-black/40 focus:outline-none focus:bg-[#F2F2F2] font-mono-plex text-sm border-r border-[#0A0A0A] sm:border-r sm:border-b-0 border-b"
              data-testid="channel-url-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#E63946] hover:bg-[#0A0A0A] text-white font-heading font-black uppercase tracking-wider text-sm px-8 py-4 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-w-[180px]"
              data-testid="fetch-channel-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching
                </>
              ) : (
                <>
                  Scan Channel <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2 font-mono-plex text-xs text-[#555555]">
            <button
              type="button"
              onClick={() => setUrl("https://www.youtube.com/@MrBeast")}
              className="px-3 py-1 border border-[#0A0A0A]/30 hover:border-[#002FA7] hover:text-[#002FA7] transition-colors"
              data-testid="example-mrbeast"
            >
              @MrBeast
            </button>
            <button
              type="button"
              onClick={() => setUrl("https://www.youtube.com/@veritasium")}
              className="px-3 py-1 border border-[#0A0A0A]/30 hover:border-[#002FA7] hover:text-[#002FA7] transition-colors"
              data-testid="example-veritasium"
            >
              @veritasium
            </button>
            <button
              type="button"
              onClick={() => setUrl("https://www.youtube.com/@fireship")}
              className="px-3 py-1 border border-[#0A0A0A]/30 hover:border-[#002FA7] hover:text-[#002FA7] transition-colors"
              data-testid="example-fireship"
            >
              @fireship
            </button>
          </div>
        </div>

        {/* Right column: stats block */}
        <div className="col-span-12 lg:col-span-4 flex flex-col">
          <StatBlock
            num="01"
            label="Accepts any format"
            value="@handle, /channel/ID, /c/name, or full URL"
            color="#E63946"
            icon={<Youtube className="w-6 h-6" />}
          />
          <StatBlock
            num="02"
            label="Includes shorts"
            value="Up to 300 items across /videos and /shorts tabs"
            color="#002FA7"
            icon={<Film className="w-6 h-6" />}
          />
          <StatBlock
            num="03"
            label="Single or bulk"
            value="Download one video or ZIP up to 30 at once"
            color="#0A0A0A"
            icon={<Download className="w-6 h-6" />}
          />
          <StatBlock
            num="04"
            label="Extracts hashtags"
            value="Parses descriptions for #tags automatically"
            color="#008A00"
            icon={<Zap className="w-6 h-6" />}
            last
          />
        </div>
      </div>

      {/* Ticker */}
      <div className="border-t border-[#0A0A0A] bg-[#0A0A0A] text-white overflow-hidden">
        <div className="marquee font-heading font-black uppercase tracking-wider text-sm py-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-8 px-8">
              <span>ENGINE: YT-DLP 2026.3</span>
              <span className="text-[#E63946]">◆</span>
              <span>FORMAT: MP4 / BEST SINGLE-FILE</span>
              <span className="text-[#E63946]">◆</span>
              <span>BULK: ZIP ARCHIVE</span>
              <span className="text-[#E63946]">◆</span>
              <span>SCOPE: VIDEOS + SHORTS</span>
              <span className="text-[#E63946]">◆</span>
              <span>OUTPUT: TITLE.MP4</span>
              <span className="text-[#E63946]">◆</span>
              <span>FREE · EDUCATIONAL USE</span>
              <span className="text-[#E63946]">◆</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatBlock({ num, label, value, color, icon, last }) {
  return (
    <div
      className={`p-8 flex-1 flex flex-col justify-between min-h-[180px] ${
        last ? "" : "border-b border-[#0A0A0A]"
      }`}
      style={{ background: "#FFFFFF" }}
    >
      <div className="flex items-start justify-between">
        <span
          className="font-heading font-black text-5xl leading-none"
          style={{ color }}
        >
          {num}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555555] mb-1">
          {label}
        </div>
        <div className="font-mono-plex text-sm text-[#0A0A0A]">{value}</div>
      </div>
    </div>
  );
}

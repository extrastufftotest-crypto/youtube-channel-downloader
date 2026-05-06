import { Search, Download, Loader2, CheckSquare, Square } from "lucide-react";

export default function BulkBar({
  total,
  filteredCount,
  selectedCount,
  onSelectAllVisible,
  onClearSelection,
  onBulkDownload,
  bulkLoading,
  search,
  setSearch,
  filter,
  setFilter,
}) {
  return (
    <section
      className="sticky top-[65px] z-20 bg-[#F2F2F2] border-b border-[#0A0A0A]"
      data-testid="bulk-bar"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 border border-[#0A0A0A] bg-white px-3 py-2 flex-1 min-w-0 max-w-xl">
          <Search className="w-4 h-4 text-[#555555]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title..."
            className="flex-1 bg-transparent focus:outline-none font-mono-plex text-sm min-w-0"
            data-testid="video-search-input"
          />
          <span className="font-mono-plex text-xs text-[#555555] whitespace-nowrap">
            {filteredCount}/{total}
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex border border-[#0A0A0A] bg-white">
          {[
            { k: "all", label: "All" },
            { k: "videos", label: "Videos" },
            { k: "shorts", label: "Shorts" },
          ].map((f, i) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`px-4 py-2 font-heading font-bold uppercase text-xs tracking-wider transition-colors ${
                i > 0 ? "border-l border-[#0A0A0A]" : ""
              } ${
                filter === f.k
                  ? "bg-[#0A0A0A] text-white"
                  : "bg-white text-[#0A0A0A] hover:bg-[#F2F2F2]"
              }`}
              data-testid={`filter-${f.k}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAllVisible}
            className="flex items-center gap-2 px-3 py-2 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white font-heading font-bold uppercase text-xs tracking-wider transition-colors"
            data-testid="select-all-btn"
          >
            {selectedCount > 0 && selectedCount >= filteredCount && filteredCount > 0 ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Select All
          </button>
          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              className="px-3 py-2 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white font-mono-plex text-xs transition-colors"
              data-testid="clear-selection-btn"
            >
              Clear ({selectedCount})
            </button>
          )}
          <button
            onClick={onBulkDownload}
            disabled={bulkLoading || selectedCount === 0}
            className="flex items-center gap-2 px-5 py-2 bg-[#E63946] text-white font-heading font-black uppercase text-xs tracking-wider hover:bg-[#0A0A0A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#E63946] disabled:border-[#0A0A0A]/30"
            data-testid="bulk-download-btn"
          >
            {bulkLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Zipping...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download ZIP
                {selectedCount > 0 && ` (${selectedCount})`}
              </>
            )}
          </button>
        </div>
      </div>
      {bulkLoading && (
        <div className="h-1 w-full bg-black/10 overflow-hidden">
          <div className="h-full bg-[#002FA7] animate-pulse w-1/2" />
        </div>
      )}
    </section>
  );
}

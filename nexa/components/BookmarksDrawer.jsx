"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Trash2, Bookmark, BookOpen, Download, Search, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function BookmarksDrawer({
  isOpen,
  onClose,
  bookmarks = [],
  onRemoveBookmark,
  onClearAll,
  onOpenArticle
}) {
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBookmarks = bookmarks.filter((b) =>
    (b.title + " " + (b.source?.name || "")).toLowerCase().includes(filterText.toLowerCase())
  );

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `saved-stories-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#112117]/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-full sm:max-w-md bg-white border-l border-[#e1ece5] p-5 sm:p-6 flex flex-col justify-between shadow-2xl">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e1ece5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eaf5ee] border border-[#a7ccb5] flex items-center justify-center text-[#16834f]">
                  <Bookmark className="w-4 h-4 fill-[#16834f]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#112117] uppercase tracking-wider">
                    Saved Reading List
                  </h3>
                  <p className="text-[11px] text-[#738c7f] font-mono">{bookmarks.length} dispatches saved</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-[#738c7f] hover:text-[#112117] rounded-lg hover:bg-[#f0f5f2] transition-colors"
                aria-label="Close saved list"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar */}
            {bookmarks.length > 0 && (
              <div className="pt-3 pb-2 space-y-2.5">
                {/* Search in bookmarks */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#738c7f]" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Search saved stories..."
                    className="w-full pl-9 pr-3 py-2 bg-[#f8faf9] border border-[#e1ece5] rounded-lg text-xs text-[#112117] placeholder-[#738c7f] focus:outline-none focus:border-[#16834f]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="text-[11px] text-[#16834f] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Export Archive (.JSON)
                  </button>
                  <button
                    onClick={onClearAll}
                    className="text-[11px] text-[#b91c1c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="mt-2 space-y-2.5 overflow-y-auto max-h-[calc(100vh-230px)] pr-1">
              {filteredBookmarks.length === 0 ? (
                <div className="text-center py-16 text-[#738c7f]">
                  <p className="text-sm font-medium text-[#455c50]">
                    {filterText ? "No matching saved articles" : "No saved articles"}
                  </p>
                  <p className="text-xs mt-1">Bookmark any story to access it here anytime.</p>
                </div>
              ) : (
                filteredBookmarks.map((article, idx) => (
                  <div
                    key={article.url || article.id || idx}
                    className="p-3 rounded-xl bg-white border border-[#e1ece5] hover:border-[#a7ccb5] hover:shadow-xs transition-colors flex gap-3"
                  >
                    {article.urlToImage && (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#f0f5f2]">
                        <Image
                          src={article.urlToImage}
                          alt=""
                          fill
                          unoptimized={!article.urlToImage.startsWith("https://images.unsplash.com/")}
                          sizes="56px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-[#16834f] uppercase tracking-wider">
                          {article.source?.name || "News"}
                        </span>
                        <h4
                          onClick={() => {
                            onOpenArticle(article);
                            onClose();
                          }}
                          className="text-xs font-semibold text-[#112117] line-clamp-2 hover:text-[#16834f] cursor-pointer"
                        >
                          {article.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e1ece5]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onOpenArticle(article);
                              onClose();
                            }}
                            className="text-[11px] font-medium text-[#16834f] flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" /> Quick View
                          </button>
                          {article.id && (
                            <Link
                              href={`/article/${article.id}`}
                              onClick={onClose}
                              className="text-[10px] text-[#455c50] hover:text-[#112117] flex items-center gap-0.5"
                              title="Open Full Page"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>Full Page</span>
                            </Link>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveBookmark(article)}
                          className="text-[#738c7f] hover:text-[#b91c1c] p-1 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e1ece5] text-center">
            <p className="text-[11px] text-[#738c7f]">
              Synced securely to your Chronicle account • Exportable anytime
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

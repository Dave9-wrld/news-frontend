"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bookmark, X, Newspaper, ArrowRight, Sparkles, TrendingUp, UserRound, PenLine } from "lucide-react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const TRENDING_SEARCHES = [
  "Artificial Intelligence",
  "Global Markets",
  "Federal Reserve",
  "Renewable Energy",
  "Biotech & Health",
  "Space Exploration",
];

export default function Navbar({
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  onClearSearch,
  bookmarksCount,
  onOpenBookmarks,
  onOpenBriefing,
  user,
  onOpenAccount,
  onOpenStudio,
}) {
  const [currentDate, setCurrentDate] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  // Auto-focus mobile input when search modal opens & handle Escape key
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setMobileSearchOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileSearchOpen]);

  const handleMobileSubmit = (e) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      onSearchSubmit(e);
      setMobileSearchOpen(false);
    }
  };

  const handleTrendingClick = (query) => {
    setSearchTerm(query);
    setTimeout(() => {
      onSearchSubmit({ preventDefault: () => {} });
      setMobileSearchOpen(false);
    }, 50);
  };

  return (
    <>
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#e1ece5] fixed top-0 left-0 right-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4 sm:gap-6">

            {/* Left: Logo & Masthead */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#eaf5ee] border border-[#a7ccb5] flex items-center justify-center text-[#16834f] group-hover:bg-[#16834f] group-hover:text-white group-hover:border-[#16834f] group-hover:shadow-[0_2px_10px_rgba(22,131,79,0.25)] transition-all duration-300">
                  <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#112117] leading-none font-sans">
                      {SITE_NAME.toUpperCase()}
                    </h1>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#738c7f] font-mono mt-1 hidden sm:block">
                    {currentDate}
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Search */}
            <div className="flex-1 max-w-md hidden md:block">
              <form onSubmit={onSearchSubmit} className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#738c7f] group-focus-within:text-[#16834f] transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search headlines, stories, topics..."
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-[#f8faf9] border border-[#e1ece5] focus:border-[#16834f] focus:bg-white rounded-lg text-[#112117] placeholder-[#738c7f] focus:outline-none focus:ring-2 focus:ring-[#16834f]/20 transition-all shadow-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#738c7f] hover:text-[#112117] p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Open search"
                className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-[#f0f5f2] border border-[#e1ece5] text-[#455c50] hover:text-[#112117] hover:border-[#a7ccb5] transition-colors"
              >
                <Search className="w-4 h-4 text-[#16834f]" />
              </button>

              <button
                onClick={onOpenBriefing}
                aria-label="Open morning briefing"
                className="flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] text-xs font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#16834f]" />
                <span className="hidden xl:inline">Briefing</span>
              </button>

              {/* Bookmarks Button */}
              <button
                onClick={onOpenBookmarks}
                aria-label="View saved articles"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] text-xs font-medium transition-all shadow-xs cursor-pointer"
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarksCount > 0 ? "text-[#16834f] fill-[#16834f]" : "text-[#16834f]"}`} />
                <span className="hidden sm:inline">Saved</span>
                {bookmarksCount > 0 && (
                  <span className="bg-[#16834f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center font-mono leading-none min-w-[16px]">
                    {bookmarksCount}
                  </span>
                )}
              </button>
              <button
                onClick={onOpenStudio}
                aria-label="Open publisher studio"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#16834f] hover:bg-[#126d41] border border-[#16834f] shadow-xs"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Publisher Studio</span>
              </button>
              <button onClick={onOpenAccount} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#455c50] hover:text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5]">
                <UserRound className="w-3.5 h-3.5 text-[#16834f]" /> <span className="hidden sm:inline">{user ? user.username : "Sign in"}</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Modern, Highly-Accessible Mobile Search Modal Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-start animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#112117]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSearchOpen(false)}
          />

          {/* Search Box Drawer */}
          <div className="relative w-full bg-white border-b border-[#e1ece5] shadow-xl p-4 sm:p-5 z-10">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16834f] uppercase tracking-wider font-mono">
                <Search className="w-3.5 h-3.5" />
                <span>Search News & Intelligence</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="p-1 rounded-md text-[#738c7f] hover:text-[#112117] hover:bg-[#f0f5f2] transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input form */}
            <form onSubmit={handleMobileSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#738c7f]" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type topic, event, or name..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#f8faf9] border border-[#e1ece5] focus:border-[#16834f] focus:bg-white rounded-lg text-[#112117] placeholder-[#738c7f] focus:outline-none focus:ring-2 focus:ring-[#16834f]/20 transition-all shadow-inner"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#738c7f] hover:text-[#112117] p-1 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#16834f] hover:bg-[#126d41] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Trending Topics Quick Pills */}
            <div className="mt-4 pt-3 border-t border-[#e1ece5]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#455c50] mb-2 font-mono">
                <TrendingUp className="w-3 h-3 text-[#16834f]" />
                <span>Trending Topics:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_SEARCHES.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => handleTrendingClick(query)}
                    className="px-2.5 py-1 text-xs bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#16834f] border border-[#e1ece5] hover:border-[#a7ccb5] rounded-md transition-colors cursor-pointer"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

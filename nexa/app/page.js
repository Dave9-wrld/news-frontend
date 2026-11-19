"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import CategoryBar from "@/components/CategoryBar";
import HeroFeatured from "@/components/HeroFeatured";
import NewsCard from "@/components/NewsCard";
import ArticleModal from "@/components/ArticleModal";
import BookmarksDrawer from "@/components/BookmarksDrawer";
import BriefingDrawer from "@/components/BriefingDrawer";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Footer from "@/components/Footer";
import AccountDrawer from "@/components/AccountDrawer";
import AuthorStudio from "@/components/AuthorStudio";
import { asResults, chronicleApi } from "@/lib/chronicleApi";
import { Search, AlertCircle, ChevronRight, Check, AlertTriangle, ArrowUp } from "lucide-react";

const PROVIDER_LABELS = {
  gnews: "GNews Intelligence",
  global_wire: "Global Wire Network",
  currents: "Currents Wire",
  newsapi: "NewsAPI",
  curated_fallback: "Sample Dispatches",
};

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [breakingHeadline, setBreakingHeadline] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [country, setCountry] = useState("us");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data source tracking
  const [dataSource, setDataSource] = useState("");
  const [isFallbackData, setIsFallbackData] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Modal, Bookmarks & Briefing
  const [activeArticle, setActiveArticle] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const debounceTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const bookmarkKey = (article) => article?.kind === "original" ? `original-${article.article_id || String(article.id || "").replace("original-", "")}` : article?.external_id || article?.id;

  const asFeedBookmark = (record) => {
    if (record.article) return { id: `original-${record.article.id}`, kind: "original", article_id: record.article.id, title: record.article.title, description: record.article.body, content: record.article.body, urlToImage: record.article.cover_image, source: { name: "The Global Chronicle" }, author: record.article.author?.username, publishedAt: record.article.published_at || record.article.created_at, bookmarkId: record.id };
    const article = record.external_article;
    return { id: article.external_id, external_id: article.external_id, kind: "external", provider: article.provider, title: article.title, description: article.description, content: article.description, url: article.canonical_url, urlToImage: article.image_url, source: { name: article.source_name }, category: article.category, publishedAt: article.published_at, bookmarkId: record.id };
  };

  // Restore the account and its server-side reading list.
  useEffect(() => {
    chronicleApi("auth/me").then((account) => { setUser(account); return chronicleApi("bookmarks?page_size=100"); }).then((records) => setBookmarks(asResults(records).map(asFeedBookmark))).catch(() => {});
  }, []);

  const saveBookmarks = (newBookmarks) => {
    const capped = newBookmarks.slice(0, 100);
    setBookmarks(capped);
  };

  const handleToggleBookmark = async (article) => {
    if (!article) return;
    if (!user) { setIsAccountOpen(true); showToast("Sign in to save articles"); return; }
    const key = bookmarkKey(article);
    const existing = bookmarks.find((bookmark) => bookmarkKey(bookmark) === key);
    try {
      if (existing) { await chronicleApi(`bookmarks/${existing.bookmarkId}`, { method: "DELETE" }); saveBookmarks(bookmarks.filter((bookmark) => bookmark !== existing)); showToast("Removed from saved list"); return; }
      const body = article.kind === "original" ? { kind: "original", article_id: article.article_id || String(article.id).replace("original-", "") } : { kind: "external", external: { external_id: article.external_id || article.id, provider: article.provider || "external", url: article.url, title: article.title, description: article.description || "", source: article.source, category: article.category } };
      const record = await chronicleApi("bookmarks", { method: "POST", body: JSON.stringify(body) });
      saveBookmarks([asFeedBookmark(record), ...bookmarks]); showToast("Saved to reading list");
    } catch (error) { showToast(error.message); }
  };

  const handleClearAllBookmarks = () => {
    Promise.all(bookmarks.map((bookmark) => chronicleApi(`bookmarks/${bookmark.bookmarkId}`, { method: "DELETE" }))).then(() => { saveBookmarks([]); showToast("Cleared reading list"); });
  };

  const handleShare = (article) => {
    const shareUrl = article.id
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/article/${article.id}`
      : article.url;

    if (typeof navigator !== "undefined" && navigator.share && shareUrl) {
      navigator
        .share({
          title: article.title,
          text: article.description,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Article permalink copied to clipboard");
    }
  };

  // Fetch Sources List
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const params = new URLSearchParams();
        params.append("type", "sources");
        if (selectedCategory && selectedCategory !== "all") {
          params.append("category", selectedCategory);
        }
        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.sources) {
          setSources(data.sources.slice(0, 30));
        }
      } catch (err) {
        console.warn("Sources notice:", err);
      }
    };
    fetchSources();
  }, [selectedCategory]);

  // Main Articles Fetch
  const fetchArticles = useCallback(
    async (pageNum = 1, isAppend = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("pageSize", "15");
        params.append("sortBy", sortBy);

        if (activeQuery) {
          params.append("type", "search");
          params.append("q", activeQuery);
          if (selectedSource && selectedSource !== "all") {
            params.append("sources", selectedSource);
          }
        } else {
          params.append("type", "headlines");
          if (selectedSource && selectedSource !== "all") {
            params.append("sources", selectedSource);
          } else {
            params.append("country", country);
            if (selectedCategory && selectedCategory !== "all") {
              params.append("category", selectedCategory);
            }
          }
        }

        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!isAppend) {
          setDataSource(data.source || "");
          setIsFallbackData(data.source === "curated_fallback");
        }

        if (data.articles && data.articles.length > 0) {
          const validArticles = data.articles.filter((a) => a.title && a.title !== "[Removed]");

          if (isAppend) {
            setArticles((prev) => {
              const existingKeys = new Set(prev.map((p) => p.id || p.url || p.title));
              const newUnique = validArticles.filter((a) => !existingKeys.has(a.id || a.url || a.title));
              return [...prev, ...newUnique];
            });
          } else {
            setArticles(validArticles);
            if (pageNum === 1 && validArticles.length > 0) {
              setBreakingHeadline(validArticles[0]);
            }
          }
          setHasMore(data.hasMore ?? validArticles.length >= 12);
        } else {
          if (!isAppend) setArticles([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to retrieve dispatches. Please verify your connection.");
      } finally {
        setIsLoading(false);
      }
    },
    [activeQuery, selectedCategory, selectedSource, country, sortBy]
  );

  // Debounced search handling
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        setActiveQuery(searchTerm.trim());
        setSelectedCategory("all");
        setSelectedSource("all");
        setPage(1);
      }, 500);
    } else if (searchTerm.trim().length === 0 && activeQuery) {
      setActiveQuery("");
      setPage(1);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm, activeQuery]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (searchTerm.trim()) {
      setActiveQuery(searchTerm.trim());
      setSelectedCategory("all");
      setSelectedSource("all");
      setPage(1);
    }
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchTerm("");
    setActiveQuery("");
    setPage(1);
  };

  const handleSelectCategory = (catId) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSelectedCategory(catId);
    setSelectedSource("all");
    setActiveQuery("");
    setSearchTerm("");
    setPage(1);
  };

  const handleSelectSource = (srcId) => {
    setSelectedSource(srcId);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArticles(nextPage, true);
  };

  const handleOpenPublisherStudio = () => {
    if (!user) {
      setIsAccountOpen(true);
      showToast("Sign in with an author or editor account to publish");
      return;
    }
    if (user.role === "reader") {
      setIsAccountOpen(true);
      showToast("This account is a reader. An editor must grant publisher access.");
      return;
    }
    setIsStudioOpen(true);
  };

  useEffect(() => {
    setPage(1);
    fetchArticles(1, false);
  }, [fetchArticles]);

  const leadArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] text-[#112117] relative overflow-x-hidden pt-[112px]">
      
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(22,131,79,0.04),transparent_70%)] pointer-events-none -z-10" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/95 backdrop-blur-md text-[#112117] border border-[#e1ece5] shadow-[0_10px_35px_rgba(0,0,0,0.08)] text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <div className="w-5 h-5 rounded-full bg-[#eaf5ee] flex items-center justify-center text-[#16834f]">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        bookmarksCount={bookmarks.length}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        user={user}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenStudio={handleOpenPublisherStudio}
      />

      {/* Category Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Fallback Warning Notice */}
        {isFallbackData && !isLoading && (
          <div className="mb-6 sm:mb-8 flex items-start gap-3 p-4 rounded-xl bg-amber-50/90 backdrop-blur-sm border border-amber-200 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Live News Feed Standby / Curated Dispatches Active</p>
              <p className="mt-1 text-amber-800 leading-relaxed font-sans">
                Currently showing verified sample dispatches. Live wire feeds will automatically reconnect on the next cycle.
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && articles.length === 0 ? (
          <LoadingSkeleton />
        ) : error && articles.length === 0 ? (
          <div className="text-center py-20 px-4 max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 text-[#b91c1c] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#112117] mb-1">Service Unreachable</h3>
            <p className="text-xs text-[#455c50] mb-5 leading-relaxed font-sans">{error}</p>
            <button
              onClick={() => fetchArticles(1, false)}
              className="px-5 py-2.5 bg-[#16834f] hover:bg-[#126d41] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 px-4 max-w-md mx-auto">
            <Search className="w-10 h-10 text-[#738c7f] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#112117] mb-1">No Matching Articles Found</h3>
            <p className="text-xs text-[#455c50] mb-5 leading-relaxed font-sans">
              No dispatches found for your query. Try broadening your search keywords.
            </p>
            <button
              onClick={() => {
                setActiveQuery("");
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedSource("all");
              }}
              className="px-5 py-2.5 bg-[#16834f] hover:bg-[#126d41] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              Return to Top Stories
            </button>
          </div>
        ) : (
          <div>
            {/* Lead Story */}
            {leadArticle && page === 1 && !activeQuery && (
              <HeroFeatured
                article={leadArticle}
                onOpenArticle={setActiveArticle}
                isBookmarked={bookmarks.some(
                  (b) => b.title === leadArticle.title || (b.url && b.url === leadArticle.url)
                )}
                onToggleBookmark={handleToggleBookmark}
                onShare={handleShare}
              />
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between pb-3.5 mb-6 sm:mb-7 border-b border-[#e1ece5]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16834f]" />
                <h2 className="text-base sm:text-lg font-bold font-editorial text-[#112117] uppercase tracking-wider">
                  {activeQuery
                    ? `Search Results: "${activeQuery}"`
                    : selectedCategory !== "all"
                    ? `${selectedCategory} Stories`
                    : "Top Stories & Headlines"}
                </h2>
              </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
              {(activeQuery || page > 1 ? articles : gridArticles).map((article, idx) => (
                <NewsCard
                  key={article.id || article.url || article.title || idx}
                  article={article}
                  itemIndex={idx}
                  onOpenArticle={setActiveArticle}
                  isBookmarked={bookmarks.some(
                    (b) => b.title === article.title || (b.url && b.url === article.url)
                  )}
                  onToggleBookmark={handleToggleBookmark}
                  onShare={handleShare}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && !isLoading && (
              <div className="mt-12 sm:mt-14 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white hover:bg-[#f0f5f2] text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-xs hover:shadow-sm cursor-pointer"
                >
                  <span>Load More Stories</span>
                  <ChevronRight className="w-4 h-4 text-[#16834f]" />
                </button>
              </div>
            )}

            {isLoading && articles.length > 0 && (
              <div className="mt-10 flex justify-center">
                <div className="h-7 w-7 rounded-full border-2 border-[#16834f] border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        )}

      </main>

      {/* Detail Modal */}
      <ArticleModal
        article={activeArticle}
        isOpen={Boolean(activeArticle)}
        onClose={() => setActiveArticle(null)}
        isBookmarked={bookmarks.some(
          (b) => b.title === activeArticle?.title || (b.url && b.url === activeArticle?.url)
        )}
        onToggleBookmark={handleToggleBookmark}
        onShare={handleShare}
        user={user}
        onRequireSignIn={() => setIsAccountOpen(true)}
      />

      {/* Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleToggleBookmark}
        onClearAll={handleClearAllBookmarks}
        onOpenArticle={setActiveArticle}
      />

      {/* Executive Briefing Drawer */}
      <BriefingDrawer
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        articles={articles}
        onOpenArticle={setActiveArticle}
      />

      <Footer />
      <AccountDrawer isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} user={user} onSignedIn={(account) => { setUser(account); chronicleApi("bookmarks?page_size=100").then((records) => setBookmarks(asResults(records).map(asFeedBookmark))); }} onSignedOut={() => { setUser(null); setBookmarks([]); }} />
      <AuthorStudio
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        user={user}
        onPublished={() => fetchArticles(1, false)}
      />

    </div>
  );
}

"use client";

import { Bookmark, Share2, Clock, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { getDynamicArticleImage } from "@/lib/imageUtils";
import { useAudioPlayer } from "@/lib/AudioContext";
import { formatPublishedDate } from "@/lib/articleUtils";
import Image from "next/image";

export default function NewsCard({
  article,
  itemIndex = 0,
  onOpenArticle,
  isBookmarked,
  onToggleBookmark,
  onShare,
}) {
  const { speakingId, isPlaying, toggleNarration } = useAudioPlayer();

  if (!article) return null;

  const dynamicFallback = getDynamicArticleImage(article.title, article.category, itemIndex);
  const imageSrc = article.urlToImage || dynamicFallback;

  const articleKey = article.url || article.title || article.id;
  const isCurrentlySpeaking = speakingId === articleKey && isPlaying;

  const handleAudioListen = (e) => {
    e.stopPropagation();
    const textToSpeak = `${article.title}. Reported by ${article.source?.name || "Global Wire"}. ${
      article.description || ""
    }`;
    toggleNarration(articleKey, textToSpeak);
  };

  const getSentimentBadge = () => {
    if (article.sentiment === "positive") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-[#eaf5ee] border border-[#a7ccb5] text-[#16834f] text-[9px] font-bold uppercase tracking-wider shadow-xs">
          {article.tag || "Breakthrough"}
        </span>
      );
    }
    if (article.sentiment === "critical") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold uppercase tracking-wider shadow-xs">
          {article.tag || "Alert"}
        </span>
      );
    }
    if (article.sentiment === "analysis") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-[9px] font-bold uppercase tracking-wider shadow-xs">
          {article.tag || "Analysis"}
        </span>
      );
    }
    return null;
  };

  return (
    <article data-news-card="true" className="flex flex-col justify-between rounded-xl bg-white border border-[#e1ece5] hover:border-[#a7ccb5] hover:shadow-[0_4px_20px_rgba(22,131,79,0.06)] hover:-translate-y-0.5 transition-all duration-300 p-4 group">
      
      {/* Top Image */}
      <div 
        onClick={() => onOpenArticle(article)}
        className="relative h-44 sm:h-48 w-full rounded-lg overflow-hidden bg-[#f0f5f2] mb-3.5 cursor-pointer border border-[#e1ece5]"
      >
        <Image
          src={imageSrc}
          alt={article.title || "News article image"}
          fill
          unoptimized={!imageSrc.startsWith("https://images.unsplash.com/")}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          referrerPolicy="no-referrer"
          onError={(e) => { 
            e.currentTarget.onerror = null;
            e.currentTarget.src = dynamicFallback; 
          }}
          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
        {/* Subtle Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md border border-[#e1ece5] text-[10px] font-bold text-[#16834f] uppercase tracking-wider shadow-xs">
            {article.source?.name || "News"}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-xs ${article.kind === "original" ? "bg-[#16834f] text-white" : "bg-white/95 text-[#455c50] border border-[#e1ece5]"}`}>
            {article.kind === "original" ? "Chronicle Original" : "External News"}
          </span>
          {getSentimentBadge()}
        </div>

        {article.readTime && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] text-[#455c50] font-mono border border-[#e1ece5] shadow-xs">
              {article.readTime}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#738c7f] mb-2 font-mono">
            <span className="flex items-center gap-1 text-[#455c50]">
              <Clock className="w-3 h-3 text-[#16834f]" />
              {formatPublishedDate(article.publishedAt).split(",")[0] || "Recent"}
            </span>
            {article.author && (
              <>
                <span className="text-[#a7ccb5]">•</span>
                <span className="truncate max-w-[130px] text-[#738c7f]">{article.author}</span>
              </>
            )}
          </div>

          <h3 className="mb-2">
            <button
              type="button"
              onClick={() => onOpenArticle(article)}
              className="text-left text-base font-editorial font-bold text-[#112117] group-hover:text-[#16834f] transition-colors cursor-pointer line-clamp-2 leading-[1.3] focus:outline-none focus:ring-1 focus:ring-[#16834f] rounded"
            >
              {article.title}
            </button>
          </h3>

          <p className="text-xs text-[#455c50] line-clamp-2 leading-relaxed mb-4 font-sans">
            {article.description || "Click to open full overview and verified reporting on this news article."}
          </p>
        </div>

        {/* Card Footer */}
        <div className="news-card-footer pt-3 border-t border-[#e1ece5] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenArticle(article)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#16834f] hover:text-[#126d41] uppercase tracking-wider transition-colors cursor-pointer focus:outline-none group/brief shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#16834f]" />
            <span>Read & discuss ({article.comment_count || 0})</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleAudioListen}
              aria-label={isCurrentlySpeaking ? "Stop audio narration" : "Listen to article audio narration"}
              className={`p-1.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#16834f] cursor-pointer ${
                isCurrentlySpeaking
                  ? "text-red-700 bg-red-50 animate-pulse border border-red-200 shadow-xs"
                  : "text-[#738c7f] hover:text-[#112117] hover:bg-[#f0f5f2]"
              }`}
              title={isCurrentlySpeaking ? "Stop Voice" : "Listen (Text-to-Speech)"}
            >
              {isCurrentlySpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#16834f]" />}
            </button>

            <button
              type="button"
              onClick={() => onShare(article)}
              aria-label="Share article"
              className="p-1.5 text-[#738c7f] hover:text-[#112117] hover:bg-[#f0f5f2] rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#16834f] cursor-pointer"
              title="Share Dispatch"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onToggleBookmark(article)}
              aria-label={isBookmarked ? "Remove from bookmarks" : "Save article bookmark"}
              className={`p-1.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#16834f] cursor-pointer ${
                isBookmarked ? "text-[#16834f] bg-[#eaf5ee] border border-[#a7ccb5]" : "text-[#738c7f] hover:text-[#112117] hover:bg-[#f0f5f2]"
              }`}
              title={isBookmarked ? "Remove Saved" : "Save for Later"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-[#16834f]" : ""}`} />
            </button>
          </div>
        </div>

      </div>

    </article>
  );
}

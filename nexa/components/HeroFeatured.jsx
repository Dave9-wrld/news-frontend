"use client";

import { Bookmark, Share2, Clock, ChevronRight, Volume2, VolumeX, MessageCircle, Flame } from "lucide-react";
import { getDynamicArticleImage } from "@/lib/imageUtils";
import { useAudioPlayer } from "@/lib/AudioContext";
import { formatPublishedDate } from "@/lib/articleUtils";
import Image from "next/image";

export default function HeroFeatured({
  article,
  onOpenArticle,
  isBookmarked,
  onToggleBookmark,
  onShare,
}) {
  const { speakingId, isPlaying, toggleNarration } = useAudioPlayer();

  if (!article) return null;

  const dynamicFallback = getDynamicArticleImage(article.title, article.category);
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

  return (
    <section className="w-full mb-8 sm:mb-12">
      <div className="rounded-2xl bg-white border border-[#e1ece5] hover:border-[#a7ccb5] transition-all duration-300 p-4 sm:p-6 lg:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(22,131,79,0.06)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left 7 Cols: Cinematic Cover Image */}
          <div 
            onClick={() => onOpenArticle(article)}
            className="lg:col-span-7 relative h-60 sm:h-80 lg:h-auto min-h-[260px] sm:min-h-[340px] rounded-xl overflow-hidden bg-[#f0f5f2] border border-[#e1ece5] group cursor-pointer"
          >
            <Image
              src={imageSrc}
              alt={article.title || "Lead story image"}
              fill
              unoptimized={!imageSrc.startsWith("https://images.unsplash.com/")}
              preload
              sizes="(max-width: 1024px) 100vw, 58vw"
              referrerPolicy="no-referrer"
              onError={(e) => { 
                e.currentTarget.onerror = null;
                e.currentTarget.src = dynamicFallback; 
              }}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            {/* Soft vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16834f] text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                <Flame className="w-3 h-3 text-emerald-200 fill-emerald-200" />
                Lead Story
              </span>
              <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-[#16834f] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#a7ccb5] shadow-xs">
                {article.source?.name || "Global News"}
              </span>
              <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-[#455c50] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#e1ece5] shadow-xs">
                {article.kind === "original" ? "Chronicle Original" : "External News"}
              </span>
            </div>

            {article.readTime && (
              <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5">
                <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[#455c50] text-[11px] font-mono border border-[#e1ece5] shadow-xs">
                  {article.readTime}
                </span>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Editorial Column */}
          <div className="lg:col-span-5 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#738c7f] mb-2.5 font-mono">
                <span className="font-semibold text-[#16834f] uppercase tracking-wide text-[11px]">
                  {article.source?.name || "Dispatch"}
                </span>
                <span className="text-[#a7ccb5]">•</span>
                <span className="flex items-center gap-1.5 text-[#455c50]">
                  <Clock className="w-3.5 h-3.5 text-[#16834f]" />
                  {formatPublishedDate(article.publishedAt)}
                </span>
              </div>

              <h2 className="mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => onOpenArticle(article)}
                  className="text-left text-xl sm:text-2xl lg:text-[26px] font-editorial font-bold text-[#112117] hover:text-[#16834f] transition-colors cursor-pointer leading-[1.25] tracking-tight focus:outline-none focus:ring-1 focus:ring-[#16834f] rounded"
                >
                  {article.title}
                </button>
              </h2>

              <p className="text-[#455c50] text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-4 mb-4 sm:mb-6 font-sans">
                {article.description || "Read comprehensive reporting, official verified statements, and strategic context on this developing dispatch."}
              </p>
            </div>

            {/* Responsive Action Buttons Row */}
            <div className="pt-4 border-t border-[#e1ece5] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onOpenArticle(article)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16834f] hover:bg-[#126d41] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-[0_2px_12px_rgba(22,131,79,0.25)] cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
                <span>Read & discuss ({article.comment_count || 0})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleAudioListen}
                  aria-label={isCurrentlySpeaking ? "Stop audio narration" : "Listen to lead story"}
                  className={`p-2.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#16834f] cursor-pointer ${
                    isCurrentlySpeaking
                      ? "text-red-700 bg-red-50 border border-red-200 shadow-xs animate-pulse"
                      : "text-[#455c50] hover:text-[#112117] bg-[#f0f5f2] hover:bg-[#eaf5ee] border border-[#e1ece5] hover:border-[#a7ccb5]"
                  }`}
                  title={isCurrentlySpeaking ? "Stop Voice" : "Listen (Text-to-Speech)"}
                >
                  {isCurrentlySpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#16834f]" />}
                </button>

                <button
                  type="button"
                  onClick={() => onShare(article)}
                  aria-label="Share article link"
                  className="p-2.5 text-[#455c50] hover:text-[#112117] bg-[#f0f5f2] hover:bg-[#eaf5ee] border border-[#e1ece5] hover:border-[#a7ccb5] rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#16834f] cursor-pointer"
                  title="Share Article"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(article)}
                  aria-label={isBookmarked ? "Remove lead story from saved list" : "Save lead story for later"}
                  className={`p-2.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#16834f] cursor-pointer ${
                    isBookmarked
                      ? "text-[#16834f] bg-[#eaf5ee] border border-[#a7ccb5]"
                      : "text-[#455c50] hover:text-[#112117] bg-[#f0f5f2] hover:bg-[#eaf5ee] border border-[#e1ece5] hover:border-[#a7ccb5]"
                  }`}
                  title={isBookmarked ? "Remove Saved" : "Save for Later"}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#16834f]" : ""}`} />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

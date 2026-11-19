"use client";

import { useState, useEffect } from "react";
import { 
  X, ExternalLink, Bookmark, Share2, Clock, User, Check, Sparkles, 
  Volume2, VolumeX, Type, ShieldCheck, Languages, RefreshCw 
} from "lucide-react";
import { getDynamicArticleImage } from "@/lib/imageUtils";
import { useAudioPlayer } from "@/lib/AudioContext";
import { formatPublishedDate } from "@/lib/articleUtils";
import ArticleDiscussion from "@/components/ArticleDiscussion";
import Image from "next/image";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish (Español)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "it", label: "Italian (Italiano)" },
  { code: "pt", label: "Portuguese (Português)" },
  { code: "zh-CN", label: "Chinese (中文)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "ar", label: "Arabic (العربية)" },
];

export default function ArticleModal({
  article,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onShare,
  user,
  onRequireSignIn,
}) {
  const { speakingId, isPlaying, toggleNarration } = useAudioPlayer();
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState("text-base");
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Translation State
  const [targetLang, setTargetLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isTranslatedView, setIsTranslatedView] = useState(false);

  const articleKey = article?.url || article?.title || article?.id;
  const isCurrentlySpeaking = speakingId === articleKey && isPlaying;

  useEffect(() => {
    if (!isOpen || !article) {
      setSummaryData(null);
      setTranslatedContent(null);
      setIsTranslatedView(false);
      return;
    }

    // Lock body scrolling when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape key listener to close modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Automatically load AI Executive Summary on open
    const fetchSummary = async () => {
      setIsLoadingSummary(true);
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: article.title,
            description: article.description,
            content: article.content,
            source: article.source,
            category: article.category,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.summary) {
          setSummaryData(data.summary);
        }
      } catch (err) {
        console.warn("Summary generation notice:", err);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummary();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, article, onClose]);

  if (!isOpen || !article) return null;

  const dynamicFallback = getDynamicArticleImage(article.title, article.category);
  const imageSrc = article.urlToImage || dynamicFallback;
  const formattedDate = formatPublishedDate(article.publishedAt);

  const handleCopy = () => {
    const shareUrl = article.id
      ? `${window.location.origin}/article/${article.id}`
      : article.url || window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTranslate = async (langCode) => {
    const langToUse = langCode || targetLang;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          content: article.content,
          targetLang: langToUse,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setTranslatedContent(data);
        setIsTranslatedView(true);
      }
    } catch (err) {
      console.warn("Translation failed:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const currentTitle = isTranslatedView && translatedContent?.translatedTitle
    ? translatedContent.translatedTitle
    : article.title;

  const currentDesc = isTranslatedView && translatedContent?.translatedDescription
    ? translatedContent.translatedDescription
    : article.description;

  const currentContent = isTranslatedView && translatedContent?.translatedContent
    ? translatedContent.translatedContent
    : article.content;

  const handleToggleAudio = () => {
    const narrationText = `${currentTitle}. Published by ${article.source?.name || "Global Wire"}. ${
      currentDesc || currentContent || ""
    }`;
    toggleNarration(articleKey, narrationText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-[#112117]/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card - Full-screen sheet on mobile, rounded card on tablet/desktop */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] bg-white border border-[#e1ece5] shadow-2xl z-10 sm:rounded-2xl flex flex-col overflow-hidden my-0 sm:my-6">
        
        {/* Top Image Banner */}
        <div className="relative h-56 sm:h-72 w-full bg-[#f0f5f2] shrink-0 border-b border-[#e1ece5]">
          <Image
            src={imageSrc}
            alt={article.title}
            fill
            unoptimized={!imageSrc.startsWith("https://images.unsplash.com/")}
            sizes="(max-width: 768px) 100vw, 800px"
            referrerPolicy="no-referrer"
            onError={(e) => { 
              e.currentTarget.onerror = null;
              e.currentTarget.src = dynamicFallback; 
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Close button in top-right */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-[#112117] border border-[#e1ece5] transition-colors shadow-md cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Source Tag & Verified Badge */}
          <div className="absolute bottom-3.5 left-4 sm:left-6 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-md bg-white/95 backdrop-blur-md text-[#16834f] border border-[#e1ece5] uppercase tracking-wider shadow-sm">
              {article.source?.name || "Global Publisher"}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#eaf5ee] text-[#16834f] border border-[#a7ccb5] shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Dispatch
            </span>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-7 md:p-8 overflow-y-auto flex-1 bg-white">
          
          {/* Metadata & Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e1ece5] text-xs text-[#738c7f]">
            <div className="flex items-center gap-2 sm:gap-3 font-mono">
              <span className="flex items-center gap-1.5 text-[#112117] font-medium">
                <User className="w-3.5 h-3.5 text-[#16834f]" />
                <span className="truncate max-w-[140px] sm:max-w-none">{article.author || "Editorial Desk"}</span>
              </span>
              <span className="text-[#a7ccb5]">•</span>
              <span className="flex items-center gap-1 text-[#455c50]">
                <Clock className="w-3.5 h-3.5 text-[#16834f]" />
                {formattedDate}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Audio Listen */}
              <button
                onClick={handleToggleAudio}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  isCurrentlySpeaking
                    ? "bg-red-50 text-red-700 border-red-200 animate-pulse shadow-xs"
                    : "bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border-[#e1ece5] hover:border-[#a7ccb5]"
                }`}
                title="Text to Speech Voice Narration"
              >
                {isCurrentlySpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#16834f]" />}
                <span>{isCurrentlySpeaking ? "Stop" : "Listen"}</span>
              </button>

              {/* Font Size Toggle */}
              <button
                onClick={() => setFontSize(fontSize === "text-base" ? "text-lg" : fontSize === "text-lg" ? "text-sm" : "text-base")}
                className="p-1.5 sm:p-2 rounded-lg bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] transition-all cursor-pointer"
                title="Adjust Text Size"
              >
                <Type className="w-3.5 h-3.5 text-[#16834f]" />
              </button>

              {/* Bookmark */}
              <button
                onClick={() => onToggleBookmark(article)}
                className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                  isBookmarked
                    ? "text-[#16834f] bg-[#eaf5ee] border-[#a7ccb5]"
                    : "text-[#455c50] hover:text-[#112117] bg-[#f0f5f2] hover:bg-[#eaf5ee] border-[#e1ece5] hover:border-[#a7ccb5]"
                }`}
                title="Save Article"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#16834f]" : ""}`} />
              </button>

              {/* Copy / Share */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] rounded-lg text-xs transition-all cursor-pointer"
                title="Copy Share Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16834f]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden sm:inline">{copied ? "Copied" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Universal In-App Translator Bar */}
          <div className="my-4 sm:my-5 p-3 sm:p-3.5 rounded-xl bg-[#f0f5f2] border border-[#e1ece5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#16834f] shrink-0" />
              <span className="font-semibold text-[#112117] whitespace-nowrap">Instant AI Translator:</span>
              <select
                value={targetLang}
                onChange={(e) => {
                  setTargetLang(e.target.value);
                  handleTranslate(e.target.value);
                }}
                className="flex-1 sm:flex-initial bg-white border border-[#e1ece5] text-[#112117] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#16834f] cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {isTranslatedView ? (
                <button
                  onClick={() => setIsTranslatedView(false)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#eaf5ee] text-[#16834f] border border-[#a7ccb5] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Show Original
                </button>
              ) : (
                <button
                  onClick={() => handleTranslate(targetLang)}
                  disabled={isTranslating}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#16834f] hover:bg-[#126d41] text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isTranslating && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{isTranslating ? "Translating..." : "Translate to " + (LANGUAGES.find(l => l.code === targetLang)?.label.split(" ")[0] || "English")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-editorial font-bold text-[#112117] my-4 sm:my-5 leading-tight tracking-tight">
            {currentTitle}
          </h2>

          {/* AI Executive Intelligence Section */}
          <div className="mb-6 sm:mb-7 p-4 sm:p-5 rounded-xl bg-[#f0f5f2] border border-[#a7ccb5]/70 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#16834f] uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4 text-[#16834f]" />
                <span>Executive Intelligence & Key Takeaways</span>
              </div>
              {summaryData?.sentiment && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-white text-[#16834f] font-semibold border border-[#a7ccb5] font-mono">
                  Tone: {summaryData.sentiment.tone}
                </span>
              )}
            </div>

            {isLoadingSummary ? (
              <div className="py-3 flex items-center gap-2.5 text-xs text-[#455c50]">
                <div className="w-4 h-4 rounded-full border-2 border-[#16834f] border-t-transparent animate-spin" />
                <span>Synthesizing executive brief...</span>
              </div>
            ) : summaryData ? (
              <div className="space-y-2.5 text-xs text-[#455c50]">
                <ul className="space-y-2">
                  {summaryData.takeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed font-sans">
                      <span className="text-[#16834f] font-bold shrink-0 mt-0.5">•</span>
                      <span className="text-[#112117]">{point}</span>
                    </li>
                  ))}
                </ul>

                {summaryData.marketImpact && (
                  <div className="mt-3 pt-2.5 border-t border-[#e1ece5] text-[11px] text-[#455c50] font-sans">
                    <strong className="text-[#112117]">Market & Sector Impact:</strong> {summaryData.marketImpact}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Article Description & Content Body */}
          <div className={`space-y-4 text-[#112117] ${fontSize} leading-relaxed font-sans`}>
            {currentDesc && (
              <p className="text-[#112117] font-medium border-l-4 border-[#16834f] pl-4 py-2 italic bg-[#f0f5f2] rounded-r-lg">
                {currentDesc}
              </p>
            )}

            {currentContent && currentContent !== currentDesc && (
              <p className="text-[#455c50] leading-relaxed whitespace-pre-line">
                {currentContent}
              </p>
            )}
          </div>

          {/* Outbound Link & Deep Permalink */}
          <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-[#e1ece5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#738c7f]">
              Full investigative text syndicated from official wires by <strong>{article.source?.name || "the publisher"}</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#16834f] hover:bg-[#126d41] text-white font-semibold rounded-lg text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  <span>Read on {article.source?.name || "Official Source"}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <ArticleDiscussion article={article} user={user} onRequireSignIn={onRequireSignIn} />

        </div>

      </div>

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Copy, Download, Volume2, VolumeX, Check, Sparkles } from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";

export default function BriefingDrawer({
  isOpen,
  onClose,
  articles = [],
  onOpenArticle,
}) {
  const { speakingId, isPlaying, toggleNarration } = useAudioPlayer();
  const [copied, setCopied] = useState(false);

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

  const topStories = articles.slice(0, 5);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const briefingKey = "briefing_drawer_tts";
  const isBriefingSpeaking = speakingId === briefingKey && isPlaying;

  const getBriefingMarkdown = () => {
    let md = `# EXECUTIVE MORNING INTELLIGENCE BRIEFING\n`;
    md += `**Date:** ${today}\n`;
    md += `**Compiled By:** Nexa / The Global Chronicle Intelligence Desk\n\n`;
    md += `## TOP 5 STORIES AT A GLANCE\n\n`;

    topStories.forEach((a, i) => {
      md += `### ${i + 1}. ${a.title}\n`;
      md += `- **Source:** ${a.source?.name || "Global Wire"}\n`;
      md += `- **Category:** ${(a.category || "general").toUpperCase()}\n`;
      md += `- **Summary:** ${a.description || a.content || "N/A"}\n`;
      md += `- **Link:** ${a.url}\n\n`;
    });

    return md;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getBriefingMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([getBriefingMarkdown()], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `Global-Dispatch-Briefing-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleTextToSpeech = () => {
    const narrationText =
      `Executive Morning Briefing for ${today}. Top stories: ` +
      topStories.map((a, i) => `Story ${i + 1}: ${a.title}. From ${a.source?.name || "Global Wire"}.`).join(" ");

    toggleNarration(briefingKey, narrationText);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#112117]/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-full sm:max-w-xl bg-white border-l border-[#e1ece5] p-5 sm:p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e1ece5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#eaf5ee] text-[#16834f] border border-[#a7ccb5] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#112117] uppercase tracking-wider">
                    Executive Morning Briefing
                  </h3>
                  <p className="text-[11px] text-[#738c7f] font-mono">{today}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-[#738c7f] hover:text-[#112117] rounded-lg hover:bg-[#f0f5f2] transition-colors"
                aria-label="Close briefing"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 my-4 pt-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16834f]" /> : <Copy className="w-3.5 h-3.5 text-[#16834f]" />}
                <span>{copied ? "Copied!" : "Copy Markdown"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#16834f]" />
                <span>Export File</span>
              </button>

              <button
                onClick={handleTextToSpeech}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                  isBriefingSpeaking
                    ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                    : "bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#112117] border-[#e1ece5] hover:border-[#a7ccb5]"
                }`}
              >
                {isBriefingSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#16834f]" />}
                <span>{isBriefingSpeaking ? "Stop Voice" : "Listen (TTS)"}</span>
              </button>
            </div>

            {/* Briefing Feed */}
            <div className="space-y-3.5 mt-4">
              {topStories.map((article, idx) => (
                <div
                  key={article.url || article.id || idx}
                  className="p-4 rounded-xl bg-white border border-[#e1ece5] hover:border-[#a7ccb5] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#eaf5ee] text-[#16834f] border border-[#a7ccb5] text-[10px] font-bold uppercase tracking-wider">
                      Item #{idx + 1} • {article.source?.name || "Global Wire"}
                    </span>
                    <span className="text-[10px] text-[#738c7f] font-mono">
                      {article.readTime || "2m read"}
                    </span>
                  </div>

                  <h4
                    onClick={() => {
                      onOpenArticle(article);
                      onClose();
                    }}
                    className="text-sm font-editorial font-bold text-[#112117] hover:text-[#16834f] transition-colors cursor-pointer leading-snug mb-2"
                  >
                    {article.title}
                  </h4>

                  <p className="text-xs text-[#455c50] leading-relaxed line-clamp-3 mb-3 font-sans">
                    {article.description || article.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#e1ece5] text-[11px]">
                    <span className="text-[#738c7f] uppercase tracking-wider text-[10px]">
                      Section: {article.category || "General"}
                    </span>
                    <button
                      onClick={() => {
                        onOpenArticle(article);
                        onClose();
                      }}
                      className="text-[#16834f] font-semibold hover:underline cursor-pointer"
                    >
                      Examine Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-[#e1ece5] text-center text-xs text-[#738c7f]">
            <p>Generated automatically via real-time global news syndication feeds.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

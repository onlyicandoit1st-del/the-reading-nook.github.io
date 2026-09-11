import React, { useState, useEffect, useRef } from "react";
import type { Book, Chapter } from "@/lib/library";
import { saveProgress } from "@/lib/library";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  List,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { getProvider, chunkForSpeech, type Voice } from "@/lib/speech";
import { toast } from "sonner";

interface ListeningViewProps {
  book: Book;
  chapters: Chapter[];
  initialChapterIdx?: number;
  onBack: () => void;
  onOpenReader: (chapterIdx: number) => void;
}

export function ListeningView({
  book,
  chapters,
  initialChapterIdx = 0,
  onBack,
  onOpenReader,
}: ListeningViewProps) {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(initialChapterIdx);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
  const [chunks, setChunks] = useState<Array<{ start: number; end: number; text: string }>>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  const currentChapter = chapters[currentChapterIdx] ??
    chapters[0] ?? {
      idx: 0,
      title: "Chapter 1",
      content: "No content available.",
    };

  // Load voices & chunk current chapter
  useEffect(() => {
    const chunkList = chunkForSpeech(currentChapter.content, 0, 320);
    setChunks(chunkList);
    setCurrentChunkIdx(0);

    const provider = getProvider("device");
    void provider.getVoices().then((v) => {
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        const en = v.find((voice) => voice.id.includes("en-") || voice.label.includes("English"));
        setSelectedVoice(en?.id ?? v[0]!.id);
      }
    });

    return () => {
      stopPlayback();
    };
  }, [currentChapterIdx, currentChapter.content]);

  // Update progress
  useEffect(() => {
    if (chapters.length > 0) {
      const percent = Math.round(((currentChapterIdx + 1) / chapters.length) * 100) / 100;
      void saveProgress(book.id, currentChapterIdx, 0, percent);
    }
  }, [book.id, currentChapterIdx, chapters.length]);

  const stopPlayback = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const provider = getProvider("device");
    provider.stop();
    setIsPlaying(false);
  };

  const playChunkAt = async (index: number) => {
    if (index >= chunks.length || index < 0) {
      stopPlayback();
      return;
    }

    stopPlayback();
    isCancelledRef.current = false;
    setIsPlaying(true);
    setCurrentChunkIdx(index);

    const provider = getProvider("device");
    let i = index;

    while (i < chunks.length && !isCancelledRef.current) {
      const chunk = chunks[i];
      if (!chunk) break;

      setCurrentChunkIdx(i);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await provider.speak(chunk.text, {
          voice: selectedVoice,
          rate,
          signal: controller.signal,
        });
        i++;
      } catch (err: unknown) {
        if (isCancelledRef.current || (err instanceof DOMException && err.name === "AbortError")) {
          break;
        }
        console.warn("Speech error:", err);
        break;
      }
    }

    if (!isCancelledRef.current) {
      setIsPlaying(false);
      // If reached end of chapter, automatically proceed to next chapter if available
      if (currentChapterIdx < chapters.length - 1) {
        setCurrentChapterIdx((prev) => prev + 1);
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      void playChunkAt(currentChunkIdx);
    }
  };

  const currentSpokenText = chunks[currentChunkIdx]?.text ?? "";

  return (
    <div
      id="listening-view"
      className="min-h-screen bg-[#1c1a18] text-[#f2ede4] flex flex-col justify-between p-6 sm:p-10 select-none"
    >
      {/* Top Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-4 border-b border-stone-800">
        <Button
          id="btn-listening-back"
          variant="ghost"
          size="sm"
          onClick={() => {
            stopPlayback();
            onBack();
          }}
          className="text-stone-400 hover:text-stone-100 hover:bg-stone-800 gap-1.5 text-xs font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Library</span>
        </Button>

        <span className="text-[11px] uppercase tracking-widest font-sans text-stone-400 font-medium">
          Audio Narration
        </span>

        <Button
          id="btn-listening-switch-reader"
          variant="ghost"
          size="sm"
          onClick={() => {
            stopPlayback();
            onOpenReader(currentChapterIdx);
          }}
          className="text-amber-400 hover:text-amber-300 hover:bg-stone-800 text-xs font-sans gap-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Read</span>
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center py-6 space-y-6 text-center">
        {/* Animated Breathing Book Cover */}
        <div
          className={`transition-all duration-500 transform ${
            isPlaying ? "scale-105" : "scale-100"
          }`}
        >
          <BookCover book={book} size="featured" />
        </div>

        {/* Title & Author */}
        <div className="space-y-1">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#f2ede4]">
            {book.title}
          </h2>
          <p className="text-xs font-sans tracking-widest uppercase text-stone-400">
            {book.author || "Unknown Author"}
          </p>
          <p className="text-sm font-serif italic text-amber-200/80 pt-1">{currentChapter.title}</p>
        </div>

        {/* Audio Wave Visualizer Simulation */}
        <div className="flex items-center justify-center gap-1 h-8 py-1">
          {[40, 70, 90, 60, 100, 75, 45, 85, 95, 50, 80, 65].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-amber-500/60 transition-all duration-200 ${
                isPlaying ? "animate-pulse" : "opacity-30"
              }`}
              style={{
                height: isPlaying ? `${Math.max(6, (h * (i % 2 === 0 ? 0.9 : 1.2)) / 3)}px` : "6px",
                animationDelay: `${i * 90}ms`,
              }}
            />
          ))}
        </div>

        {/* Currently Spoken Passage Quote Box */}
        {currentSpokenText && (
          <div className="w-full bg-stone-900/80 border border-stone-800 rounded-xl p-4 text-xs font-serif italic text-stone-300 line-clamp-3 leading-relaxed">
            "{currentSpokenText}"
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex justify-between items-center text-[11px] font-mono text-stone-400">
            <span>
              Segment {currentChunkIdx + 1} of {chunks.length || 1}
            </span>
            <span>
              Chapter {currentChapterIdx + 1} of {chapters.length}
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 transition-all duration-200"
              style={{
                width: `${chunks.length > 0 ? ((currentChunkIdx + 1) / chunks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
          {/* Previous Chapter */}
          <Button
            variant="ghost"
            size="icon"
            disabled={currentChapterIdx <= 0}
            onClick={() => {
              stopPlayback();
              setCurrentChapterIdx((prev) => Math.max(0, prev - 1));
            }}
            className="text-stone-400 hover:text-stone-100 hover:bg-stone-800 h-10 w-10"
            title="Previous Chapter"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          {/* Rewind Segment */}
          <Button
            variant="ghost"
            size="icon"
            disabled={currentChunkIdx <= 0}
            onClick={() => {
              const prev = Math.max(0, currentChunkIdx - 1);
              void playChunkAt(prev);
            }}
            className="text-stone-300 hover:text-white hover:bg-stone-800 h-10 w-10"
            title="Rewind sentence"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Master Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          {/* Forward Segment */}
          <Button
            variant="ghost"
            size="icon"
            disabled={currentChunkIdx >= chunks.length - 1}
            onClick={() => {
              const next = Math.min(chunks.length - 1, currentChunkIdx + 1);
              void playChunkAt(next);
            }}
            className="text-stone-300 hover:text-white hover:bg-stone-800 h-10 w-10"
            title="Skip sentence"
          >
            <RotateCw className="w-4 h-4" />
          </Button>

          {/* Next Chapter */}
          <Button
            variant="ghost"
            size="icon"
            disabled={currentChapterIdx >= chapters.length - 1}
            onClick={() => {
              stopPlayback();
              setCurrentChapterIdx((prev) => Math.min(chapters.length - 1, prev + 1));
            }}
            className="text-stone-400 hover:text-stone-100 hover:bg-stone-800 h-10 w-10"
            title="Next Chapter"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </main>

      {/* Footer Voice & Speed Settings */}
      <footer className="max-w-xl mx-auto w-full pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Voice selector */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-stone-400 shrink-0" />
          {voices.length > 0 ? (
            <select
              value={selectedVoice ?? ""}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                if (isPlaying) void playChunkAt(currentChunkIdx);
              }}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-md px-2 py-1 max-w-[160px] truncate focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-stone-400 text-xs">Default Voice</span>
          )}
        </div>

        {/* Speed chips */}
        <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-lg border border-stone-800">
          <span className="text-[10px] text-stone-400 px-1 font-sans">Speed:</span>
          {[0.8, 1.0, 1.25, 1.5].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => {
                setRate(spd);
                if (isPlaying) void playChunkAt(currentChunkIdx);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                rate === spd
                  ? "bg-amber-700 text-white font-semibold"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

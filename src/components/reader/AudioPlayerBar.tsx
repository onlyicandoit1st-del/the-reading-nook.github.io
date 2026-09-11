import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, FastForward, Rewind, Headphones, X, Volume2 } from "lucide-react";
import { getProvider, chunkForSpeech, type Voice } from "@/lib/speech";

interface AudioPlayerBarProps {
  currentText: string;
  chapterTitle: string;
  onActiveChunkChange?: (chunkIndex: number, text: string) => void;
  onClose: () => void;
}

export function AudioPlayerBar({
  currentText,
  chapterTitle,
  onActiveChunkChange,
  onClose,
}: AudioPlayerBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunks, setChunks] = useState<Array<{ start: number; end: number; text: string }>>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  // Initialize chunks and voices
  useEffect(() => {
    const chunkList = chunkForSpeech(currentText, 0, 320);
    setChunks(chunkList);
    setCurrentChunkIndex(0);

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
  }, [currentText]);

  const stopPlayback = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const provider = getProvider("device");
    provider.stop();
    setIsPlaying(false);
    onActiveChunkChange?.(-1, "");
  };

  const playChunkAt = async (index: number) => {
    if (index >= chunks.length || index < 0) {
      stopPlayback();
      return;
    }

    stopPlayback();
    isCancelledRef.current = false;
    setIsPlaying(true);
    setCurrentChunkIndex(index);

    const provider = getProvider("device");
    let i = index;

    while (i < chunks.length && !isCancelledRef.current) {
      const chunk = chunks[i];
      if (!chunk) break;

      setCurrentChunkIndex(i);
      onActiveChunkChange?.(i, chunk.text);

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
        console.warn("Speech playback error:", err);
        break;
      }
    }

    if (!isCancelledRef.current) {
      setIsPlaying(false);
      onActiveChunkChange?.(-1, "");
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      void playChunkAt(currentChunkIndex);
    }
  };

  const skipForward = () => {
    const next = Math.min(chunks.length - 1, currentChunkIndex + 1);
    void playChunkAt(next);
  };

  const skipBackward = () => {
    const prev = Math.max(0, currentChunkIndex - 1);
    void playChunkAt(prev);
  };

  const progressPercent =
    chunks.length > 0 ? Math.round(((currentChunkIndex + 1) / chunks.length) * 100) : 0;

  return (
    <div
      id="audio-player-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#1c1a18] text-[#ede8df] border-t border-[#38332d] shadow-2xl px-3 sm:px-6 pt-3 pb-[max(env(safe-area-inset-bottom,0px),12px)] transition-all animate-in slide-in-from-bottom duration-200"
    >
      <div className="max-w-3xl mx-auto space-y-2.5">
        {/* Top bar: Info + Main Play Controls + Close */}
        <div className="flex items-center justify-between gap-2">
          {/* Track Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Headphones className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  Audio Read
                </span>
                {chunks.length > 0 && (
                  <span className="text-[10px] font-mono text-stone-400">
                    {currentChunkIndex + 1}/{chunks.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-200 font-serif font-medium truncate">
                {chapterTitle || "Chapter"}
              </p>
            </div>
          </div>

          {/* Primary Playback controls */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              id="btn-tts-prev"
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              disabled={currentChunkIndex <= 0}
              className="text-stone-300 hover:text-white hover:bg-stone-800 h-9 w-9 active:scale-95"
              title="Previous paragraph"
            >
              <Rewind className="w-4 h-4" />
            </Button>

            <Button
              id="btn-tts-toggle"
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="bg-amber-600 hover:bg-amber-500 text-white h-10 w-10 rounded-full shadow-md active:scale-95 transition-transform"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            <Button
              id="btn-tts-next"
              variant="ghost"
              size="icon"
              onClick={skipForward}
              disabled={currentChunkIndex >= chunks.length - 1}
              className="text-stone-300 hover:text-white hover:bg-stone-800 h-9 w-9 active:scale-95"
              title="Next paragraph"
            >
              <FastForward className="w-4 h-4" />
            </Button>

            <Button
              id="btn-tts-stop"
              variant="ghost"
              size="icon"
              onClick={stopPlayback}
              className="text-stone-400 hover:text-white hover:bg-stone-800 h-8 w-8 ml-0.5"
              title="Stop audio"
            >
              <Square className="w-3.5 h-3.5" />
            </Button>

            <Button
              id="btn-close-audio"
              variant="ghost"
              size="icon"
              onClick={() => {
                stopPlayback();
                onClose();
              }}
              className="text-stone-400 hover:text-white hover:bg-stone-800 h-8 w-8 ml-1"
              title="Close audio reader"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress scrub bar */}
        <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(progressPercent, 2)}%` }}
          />
        </div>

        {/* Bottom micro-row: Rate selector & Voice dropdown */}
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
          {/* Rate Selector */}
          <div className="flex items-center gap-1 bg-stone-800/80 px-2 py-1 rounded-lg border border-stone-700/80">
            <span className="text-[10px] text-stone-400 font-sans">Speed:</span>
            {[0.8, 1.0, 1.2, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => {
                  setRate(spd);
                  if (isPlaying) {
                    void playChunkAt(currentChunkIndex);
                  }
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono min-h-[24px] flex items-center justify-center ${
                  rate === spd
                    ? "bg-amber-700 text-white font-semibold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Voice selector */}
          {voices.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                id="select-voice"
                value={selectedVoice ?? ""}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                  if (isPlaying) {
                    void playChunkAt(currentChunkIndex);
                  }
                }}
                className="bg-stone-800/90 border border-stone-700/80 text-stone-200 text-[11px] rounded-lg px-2 py-1 max-w-[150px] sm:max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-amber-500 h-7"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

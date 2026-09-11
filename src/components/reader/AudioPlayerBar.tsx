import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Headphones,
  X,
} from "lucide-react";
import { speechProviders, getProvider, chunkForSpeech, type Voice } from "@/lib/speech";
import { toast } from "sonner";

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
        // Pick an English or default voice
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

  return (
    <div
      id="audio-player-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900 text-stone-100 border-t border-stone-800 shadow-xl px-4 py-3 sm:px-8"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Track info */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="p-2 rounded-md bg-amber-900/40 text-amber-300">
            <Headphones className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Audio Reading
            </p>
            <p className="text-xs text-stone-300 truncate font-serif">
              {chapterTitle || "Current Chapter"}
            </p>
            {chunks.length > 0 && (
              <p className="text-[10px] text-stone-400">
                Segment {currentChunkIndex + 1} of {chunks.length}
              </p>
            )}
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <Button
            id="btn-tts-prev"
            variant="ghost"
            size="icon"
            onClick={skipBackward}
            disabled={currentChunkIndex <= 0}
            className="text-stone-300 hover:text-white hover:bg-stone-800 h-8 w-8"
          >
            <Rewind className="w-4 h-4" />
          </Button>

          <Button
            id="btn-tts-toggle"
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="bg-amber-600 hover:bg-amber-500 text-white h-10 w-10 rounded-full"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>

          <Button
            id="btn-tts-next"
            variant="ghost"
            size="icon"
            onClick={skipForward}
            disabled={currentChunkIndex >= chunks.length - 1}
            className="text-stone-300 hover:text-white hover:bg-stone-800 h-8 w-8"
          >
            <FastForward className="w-4 h-4" />
          </Button>

          <Button
            id="btn-tts-stop"
            variant="ghost"
            size="icon"
            onClick={stopPlayback}
            className="text-stone-400 hover:text-white hover:bg-stone-800 h-8 w-8 ml-1"
          >
            <Square className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Voice and Speed settings */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {voices.length > 0 && (
            <select
              id="select-voice"
              value={selectedVoice ?? ""}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                if (isPlaying) {
                  void playChunkAt(currentChunkIndex);
                }
              }}
              className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded px-2 py-1 max-w-[140px] truncate focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          )}

          {/* Speed picker */}
          <div className="flex items-center gap-1.5 bg-stone-800/80 px-2 py-1 rounded text-xs border border-stone-700">
            <span className="text-[11px] text-stone-400">Rate:</span>
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
                className={`px-1 rounded text-[10px] font-mono ${
                  rate === spd
                    ? "bg-amber-700 text-white font-bold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <Button
            id="btn-close-audio"
            variant="ghost"
            size="icon"
            onClick={() => {
              stopPlayback();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-100 hover:bg-stone-800 h-8 w-8 ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

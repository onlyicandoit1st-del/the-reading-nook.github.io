import { synthesizeSpeech } from "@/lib/tts.functions";

/**
 * Modular speech layer.
 * Any provider that implements SpeechProvider can be plugged in without
 * touching the listening screen.
 */

export type Voice = { id: string; label: string };

export type SpeakOptions = {
  voice: string | null;
  rate: number;
  signal: AbortSignal;
};

export type SpeechProvider = {
  id: string;
  label: string;
  description: string;
  isAvailable: () => boolean;
  getVoices: () => Promise<Voice[]>;
  /** Resolves once the passage has finished playing. Rejects on abort/failure. */
  speak: (text: string, options: SpeakOptions) => Promise<void>;
  stop: () => void;
};

/* ---------- device voices (offline, free, built into the phone) ---------- */

const deviceProvider: SpeechProvider = {
  id: "device",
  label: "Device voices",
  description: "Built into your phone or browser. Works offline.",
  isAvailable: () => typeof window !== "undefined" && "speechSynthesis" in window,
  getVoices: async () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    const read = () =>
      window.speechSynthesis
        .getVoices()
        .map((v) => ({ id: v.voiceURI, label: `${v.name} (${v.lang})` }));
    const first = read();
    if (first.length) return first;
    return new Promise<Voice[]>((resolve) => {
      const timer = setTimeout(() => resolve(read()), 800);
      window.speechSynthesis.onvoiceschanged = () => {
        clearTimeout(timer);
        resolve(read());
      };
    });
  },
  speak: (text, { voice, rate, signal }) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(new DOMException("aborted", "AbortError"));
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      const match = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voice);
      if (match) utterance.voice = match;
      const onAbort = () => {
        window.speechSynthesis.cancel();
        reject(new DOMException("aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      utterance.onend = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      utterance.onerror = (e) => {
        signal.removeEventListener("abort", onAbort);
        if (signal.aborted) return;
        reject(new Error(e.error || "Speech failed"));
      };
      window.speechSynthesis.speak(utterance);
    }),
  stop: () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  },
};

/* ---------- cloud voices (natural sounding, via the app backend) ---------- */

let activeAudio: HTMLAudioElement | null = null;

const cloudProvider: SpeechProvider = {
  id: "cloud",
  label: "Natural voices",
  description: "Higher quality voices generated in the cloud. Needs a connection.",
  isAvailable: () => typeof window !== "undefined",
  getVoices: async () =>
    ["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map((id) => ({
      id,
      label: id[0]!.toUpperCase() + id.slice(1),
    })),
  speak: async (text, { voice, rate, signal }) => {
    const result = await synthesizeSpeech({ data: { text, voice: voice ?? "alloy" } });
    if (signal.aborted) throw new DOMException("aborted", "AbortError");
    const audio = new Audio(`data:${result.mime};base64,${result.audio}`);
    audio.playbackRate = rate;
    activeAudio = audio;
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        audio.pause();
        reject(new DOMException("aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      audio.onended = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      audio.onerror = () => {
        signal.removeEventListener("abort", onAbort);
        reject(new Error("Could not play the generated audio."));
      };
      void audio.play().catch(reject);
    });
  },
  stop: () => {
    activeAudio?.pause();
    activeAudio = null;
  },
};

export const speechProviders: SpeechProvider[] = [deviceProvider, cloudProvider];

export function getProvider(id: string): SpeechProvider {
  return speechProviders.find((p) => p.id === id) ?? deviceProvider;
}

/** Split a passage into speakable chunks, keeping their character offsets. */
export function chunkForSpeech(text: string, from = 0, size = 420) {
  const chunks: Array<{ start: number; end: number; text: string }> = [];
  const sentence = /[^.!?]+[.!?]*\s*/g;
  let buffer = "";
  let bufferStart = from;
  let cursor = from;
  const source = text.slice(from);
  sentence.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = sentence.exec(source))) {
    const piece = match[0];
    if (!buffer) bufferStart = from + match.index;
    buffer += piece;
    cursor = from + match.index + piece.length;
    if (buffer.length >= size) {
      chunks.push({ start: bufferStart, end: cursor, text: buffer.trim() });
      buffer = "";
    }
  }
  if (buffer.trim()) chunks.push({ start: bufferStart, end: cursor, text: buffer.trim() });
  return chunks.filter((c) => c.text.length > 0);
}

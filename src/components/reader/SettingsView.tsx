import React, { useState, useEffect } from "react";
import type { Preferences } from "@/lib/library";
import { defaultPreferences, clearAllLibraryData } from "@/lib/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Type,
  Sun,
  Moon,
  Coffee,
  Database,
  User,
  Trash2,
  Check,
  ShieldCheck,
  Volume2,
  Play,
  RotateCcw,
  Download,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

interface SettingsViewProps {
  preferences: Preferences;
  onUpdatePreferences: (patch: Partial<Preferences>) => void;
  onOpenSignIn: () => void;
  onNavigateTab?: (tab: "library" | "search" | "settings") => void;
  booksCount?: number;
  onLibraryReset?: () => void;
}

export function SettingsView({
  preferences,
  onUpdatePreferences,
  onOpenSignIn,
  onNavigateTab,
  booksCount = 0,
  onLibraryReset,
}: SettingsViewProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [userName, setUserName] = useState(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("lumen_user_name") || "Reader"
      : "Reader";
  });
  const [nameInput, setNameInput] = useState(userName);
  const [isEditingName, setIsEditingName] = useState(false);

  // Audio voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>(preferences.voice || "");
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setAvailableVoices(v);
        if (!selectedVoiceUri && v[0]) {
          setSelectedVoiceUri(v[0].voiceURI);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoiceUri]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim() || "Reader";
    setUserName(clean);
    setNameInput(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("lumen_user_name", clean);
    }
    setIsEditingName(false);
    toast.success(`Display name updated to "${clean}"`);
  };

  const handleTestVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Speech synthesis is not supported on this browser");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Lumen reading companion. This is your selected audio voice and pace.",
    );

    if (selectedVoiceUri) {
      const found = availableVoices.find((v) => v.voiceURI === selectedVoiceUri);
      if (found) utterance.voice = found;
    }
    utterance.rate = preferences.playback_rate || 1.0;

    setIsTestingVoice(true);
    utterance.onend = () => setIsTestingVoice(false);
    utterance.onerror = () => setIsTestingVoice(false);

    window.speechSynthesis.speak(utterance);
    toast.success("Playing voice preview");
  };

  const handleVoiceChange = (uri: string) => {
    setSelectedVoiceUri(uri);
    onUpdatePreferences({ voice: uri });
    toast.success("Reading voice preference updated");
  };

  const handleResetLibrary = async () => {
    const confirmed = confirm(
      "Are you sure you want to permanently clear all uploaded books, annotations, notes, and reading progress? Your library will be completely empty.",
    );
    if (!confirmed) return;

    setIsClearing(true);
    try {
      await clearAllLibraryData();
      toast.success("Library completely cleared. Ready for your own books.");
      if (onLibraryReset) {
        onLibraryReset();
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch {
      toast.error("Failed to clear library data");
    } finally {
      setIsClearing(false);
    }
  };

  const handleRestoreDefaultPrefs = () => {
    onUpdatePreferences(defaultPreferences);
    toast.success("Typography and display preferences restored to defaults");
  };

  // Theme palettes
  const isDark = preferences.theme === "dark";
  const isCream = preferences.theme === "cream";

  const themeStyles = isDark
    ? {
        bg: "bg-[#181716]",
        text: "text-[#ede8df]",
        headerBg: "bg-[#181716]/85 border-[#36332f]",
        cardBg: "bg-[#22201e] border-[#36332f]",
        subText: "text-[#9e988f]",
        inputBg: "bg-[#181716] border-[#36332f] text-[#ede8df]",
        badgeBg: "bg-[#2d2a27] text-[#ede8df] border-[#36332f]",
        divider: "border-[#36332f]",
        accentBtn: "bg-[#d99b5b] hover:bg-[#c28444] text-[#181716]",
      }
    : isCream
      ? {
          bg: "bg-[#f4eee3]",
          text: "text-[#2b241a]",
          headerBg: "bg-[#f4eee3]/85 border-[#dfd6c4]",
          cardBg: "bg-[#faf6ee] border-[#dfd6c4]",
          subText: "text-[#7c6f5e]",
          inputBg: "bg-white border-[#dfd6c4] text-[#2b241a]",
          badgeBg: "bg-[#ede4d4] text-[#2b241a] border-[#dfd6c4]",
          divider: "border-[#dfd6c4]",
          accentBtn: "bg-[#2b241a] hover:bg-stone-800 text-[#f4eee3]",
        }
      : {
          bg: "bg-[#faf8f5]",
          text: "text-[#24201c]",
          headerBg: "bg-[#faf8f5]/85 border-[#e8e4dc]",
          cardBg: "bg-white border-[#e8e4dc]",
          subText: "text-[#78716c]",
          inputBg: "bg-white border-[#e8e4dc] text-[#24201c]",
          badgeBg: "bg-[#f1ede6] text-[#24201c] border-[#e8e4dc]",
          divider: "border-[#e8e4dc]",
          accentBtn: "bg-[#24201c] hover:bg-stone-800 text-[#faf8f5]",
        };

  return (
    <div
      id="settings-view"
      className={`min-h-screen transition-colors duration-200 ${themeStyles.bg} ${themeStyles.text} pb-32`}
    >
      {/* Top Header */}
      <header
        className={`border-b ${themeStyles.headerBg} backdrop-blur sticky top-0 z-20 px-4 sm:px-6 py-4 sm:py-5 transition-colors`}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onNavigateTab && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab("library")}
                className={`text-xs px-2 h-8 gap-1 ${themeStyles.subText} hover:opacity-100 shrink-0`}
                title="Back to Library"
              >
                <span>←</span>
                <span className="font-serif">Library</span>
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight truncate">
                Settings & Preferences
              </h1>
              <p className={`text-[11px] sm:text-xs font-sans truncate ${themeStyles.subText}`}>
                Atmosphere, typography & library storage
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestoreDefaultPrefs}
            className={`text-xs gap-1.5 h-8 px-2 sm:px-3 shrink-0 ${themeStyles.subText} hover:opacity-100`}
            title="Restore Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Profile Card */}
        <section
          className={`rounded-2xl p-4 sm:p-6 border shadow-xs transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${themeStyles.cardBg}`}
        >
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {/* Typographic Monogram Avatar */}
            <div
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-serif text-lg sm:text-xl font-medium shadow-xs border shrink-0 select-none ${
                isDark
                  ? "bg-[#332e27] text-amber-200 border-[#4a4237]"
                  : "bg-[#2b241a] text-[#faf6ee] border-[#443a2c]"
              }`}
            >
              {userName.charAt(0).toUpperCase() || "R"}
            </div>

            <div className="flex-1 min-w-0">
              {!isEditingName ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-semibold text-base truncate">{userName}</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className={`text-[11px] underline underline-offset-2 ${themeStyles.subText} hover:opacity-100`}
                  >
                    Edit name
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSaveName}
                  className="flex items-center gap-2 mt-1 w-full max-w-sm"
                >
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className={`text-xs h-8 px-2.5 flex-1 min-w-0 rounded-lg ${themeStyles.inputBg}`}
                    placeholder="Enter name"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className={`h-8 text-xs px-3 shrink-0 ${themeStyles.accentBtn}`}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNameInput(userName);
                      setIsEditingName(false);
                    }}
                    className={`h-8 text-xs px-2 shrink-0 ${themeStyles.subText}`}
                  >
                    Cancel
                  </Button>
                </form>
              )}
              <p
                className={`text-[11px] sm:text-xs font-sans mt-0.5 truncate ${themeStyles.subText}`}
              >
                Personal Offline Bookshelf · {booksCount} {booksCount === 1 ? "volume" : "volumes"}{" "}
                stored
              </p>
            </div>
          </div>

          <Button
            id="btn-settings-account"
            variant="outline"
            size="sm"
            onClick={onOpenSignIn}
            className={`border text-xs font-sans w-full sm:w-auto shrink-0 ${themeStyles.badgeBg} hover:opacity-90`}
          >
            Cloud Account Sync
          </Button>
        </section>

        {/* LIVE TYPOGRAPHY PREVIEW CARD */}
        <section
          className={`rounded-2xl p-4 sm:p-6 border shadow-xs space-y-3 transition-colors ${themeStyles.cardBg}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif text-base font-semibold">Live Typography Preview</h3>
            </div>
            <span
              className={`font-mono text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md border shrink-0 ${themeStyles.badgeBg}`}
            >
              {preferences.font_family === "serif" ? "Literata" : "Work Sans"} ·{" "}
              {preferences.font_size}px
            </span>
          </div>

          <div
            className={`p-4 sm:p-6 rounded-xl border transition-all duration-200 overflow-hidden ${
              isDark
                ? "bg-[#1f1d1b] border-[#36332f]"
                : isCream
                  ? "bg-[#f5efe6] border-[#dfd6c4]"
                  : "bg-[#faf8f5] border-[#e8e4dc]"
            }`}
            style={{
              fontFamily:
                preferences.font_family === "serif"
                  ? '"Literata", Georgia, serif'
                  : '"Work Sans", system-ui, sans-serif',
              fontSize: `${preferences.font_size}px`,
              lineHeight: preferences.line_height,
              paddingLeft: `${Math.max(preferences.margin || 24, 16)}px`,
              paddingRight: `${Math.max(preferences.margin || 24, 16)}px`,
            }}
          >
            <p className="indent-4 select-none text-left">
              Books are a uniquely portable magic. Within these pages, time bends, quiet returns,
              and the world outside softens into still reflection. Reading is the quiet craft of
              living twice.
            </p>
          </div>
          <p className={`text-[10px] sm:text-[11px] font-sans ${themeStyles.subText} text-right`}>
            Changes to font, line spacing, margins, and atmosphere apply instantly across your
            reader.
          </p>
        </section>

        {/* Reading Atmosphere (Theme) */}
        <section
          className={`rounded-2xl p-4 sm:p-6 border shadow-xs space-y-4 transition-colors ${themeStyles.cardBg}`}
        >
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif text-base font-semibold">Reader Atmosphere</h3>
          </div>
          <p className={`text-xs font-sans ${themeStyles.subText}`}>
            Select your preferred paper background and contrast tone.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
            {[
              {
                id: "paper",
                label: "Natural Paper",
                desc: "Off-white ivory",
                bg: "#faf8f5",
                border: "#e8e4dc",
                text: "#24201c",
                indicatorBg: "#faf8f5",
              },
              {
                id: "cream",
                label: "Warm Cream",
                desc: "Mellow sepia",
                bg: "#f4eee3",
                border: "#dfd6c4",
                text: "#2b241a",
                indicatorBg: "#e8ddc9",
              },
              {
                id: "dark",
                label: "Charcoal Night",
                desc: "Low-light ink",
                bg: "#181716",
                border: "#36332f",
                text: "#ede8df",
                indicatorBg: "#2d2a27",
              },
            ].map((th) => {
              const isSelected = preferences.theme === th.id;
              return (
                <button
                  key={th.id}
                  id={`btn-theme-${th.id}`}
                  type="button"
                  onClick={() => {
                    onUpdatePreferences({ theme: th.id as Preferences["theme"] });
                    toast.success(`Theme set to ${th.label}`);
                  }}
                  style={{ backgroundColor: th.bg, color: th.text, borderColor: th.border }}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left flex items-center justify-between sm:flex-col sm:justify-between min-h-[54px] sm:h-24 transition-all duration-200 active:scale-98 ${
                    isSelected
                      ? "ring-2 ring-amber-600 shadow-md scale-[1.01]"
                      : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:block">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0 sm:hidden block"
                      style={{ backgroundColor: th.indicatorBg }}
                    />
                    <div>
                      <span className="font-serif text-xs font-semibold block">{th.label}</span>
                      <span className="text-[10px] font-sans opacity-70 block mt-0.5">
                        {th.desc}
                      </span>
                    </div>
                  </div>
                  {isSelected ? (
                    <div className="bg-amber-600 text-white rounded-full p-1 shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-stone-400/40 shrink-0 sm:hidden" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Typography Settings */}
        <section
          className={`rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6 transition-colors ${themeStyles.cardBg}`}
        >
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif text-base font-semibold">Typography & Flow</h3>
          </div>

          {/* Typeface selector */}
          <div className="space-y-2">
            <label className={`text-xs font-sans font-medium ${themeStyles.subText}`}>
              Typeface Family
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                id="btn-font-serif"
                onClick={() => {
                  onUpdatePreferences({ font_family: "serif" });
                  toast.success("Font set to Literata Serif");
                }}
                className={`p-3 sm:p-3.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                  preferences.font_family === "serif"
                    ? "border-amber-600 bg-amber-500/10 font-semibold ring-1 ring-amber-600"
                    : `border-transparent ${themeStyles.badgeBg} hover:opacity-90`
                }`}
              >
                <div>
                  <p className="font-serif text-sm">Literata Serif</p>
                  <p className={`text-[11px] font-sans ${themeStyles.subText}`}>
                    Designed for long-form literary immersion
                  </p>
                </div>
                {preferences.font_family === "serif" && (
                  <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                )}
              </button>

              <button
                type="button"
                id="btn-font-sans"
                onClick={() => {
                  onUpdatePreferences({ font_family: "sans" });
                  toast.success("Font set to Work Sans");
                }}
                className={`p-3 sm:p-3.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                  preferences.font_family === "sans"
                    ? "border-amber-600 bg-amber-500/10 font-semibold ring-1 ring-amber-600"
                    : `border-transparent ${themeStyles.badgeBg} hover:opacity-90`
                }`}
              >
                <div>
                  <p className="font-sans text-sm">Work Sans</p>
                  <p className={`text-[11px] font-sans ${themeStyles.subText}`}>
                    Contemporary, clear geometric grotesque
                  </p>
                </div>
                {preferences.font_family === "sans" && (
                  <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                )}
              </button>
            </div>
          </div>

          {/* Font size */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className={`font-sans font-medium ${themeStyles.subText}`}>Base Font Size</span>
              <span className="font-mono font-semibold px-2 py-0.5 rounded border text-xs">
                {preferences.font_size}px
              </span>
            </div>
            <Slider
              value={[preferences.font_size]}
              min={13}
              max={28}
              step={1}
              onValueChange={([val]) => onUpdatePreferences({ font_size: val })}
              className="py-3"
            />
            <div className={`flex justify-between text-[10px] ${themeStyles.subText} px-0.5`}>
              <span>Small (13px)</span>
              <span>Default (17px)</span>
              <span>Large (28px)</span>
            </div>
          </div>

          {/* Line spacing */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className={`font-sans font-medium ${themeStyles.subText}`}>
                Line Height Spacing
              </span>
              <span className="font-mono font-semibold px-2 py-0.5 rounded border text-xs">
                {preferences.line_height}x
              </span>
            </div>
            <Slider
              value={[preferences.line_height]}
              min={1.3}
              max={2.4}
              step={0.1}
              onValueChange={([val]) =>
                onUpdatePreferences({ line_height: Number(val.toFixed(1)) })
              }
              className="py-3"
            />
            <div className={`flex justify-between text-[10px] ${themeStyles.subText} px-0.5`}>
              <span>Compact (1.3x)</span>
              <span>Default (1.7x)</span>
              <span>Spacious (2.4x)</span>
            </div>
          </div>

          {/* Page Margins */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className={`font-sans font-medium ${themeStyles.subText}`}>Page Margins</span>
              <span className="font-mono font-semibold px-2 py-0.5 rounded border text-xs">
                {preferences.margin || 24}px
              </span>
            </div>
            <Slider
              value={[preferences.margin || 24]}
              min={12}
              max={48}
              step={4}
              onValueChange={([val]) => onUpdatePreferences({ margin: val })}
              className="py-3"
            />
            <div className={`flex justify-between text-[10px] ${themeStyles.subText} px-0.5`}>
              <span>Compact (12px)</span>
              <span>Balanced (24px)</span>
              <span>Spacious (48px)</span>
            </div>
          </div>
        </section>

        {/* Read-Aloud & Audio Playback */}
        <section
          className={`rounded-2xl p-4 sm:p-6 border shadow-xs space-y-5 transition-colors ${themeStyles.cardBg}`}
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif text-base font-semibold">Text-to-Speech & Read Aloud</h3>
          </div>
          <p className={`text-xs font-sans ${themeStyles.subText}`}>
            Listen to any chapter with built-in synthesized voice narration.
          </p>

          {/* Playback speed */}
          <div className="space-y-2">
            <label className={`text-xs font-sans font-medium ${themeStyles.subText}`}>
              Narration Speed
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    onUpdatePreferences({ playback_rate: rate });
                    toast.success(`Narration speed set to ${rate}x`);
                  }}
                  className={`py-2 rounded-lg text-xs font-mono border text-center transition-all active:scale-95 ${
                    (preferences.playback_rate || 1.0) === rate
                      ? "border-amber-600 bg-amber-600 text-white font-semibold"
                      : `border-transparent ${themeStyles.badgeBg} hover:opacity-80`
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Voice selector */}
          {availableVoices.length > 0 && (
            <div className="space-y-2 pt-1">
              <label className={`text-xs font-sans font-medium ${themeStyles.subText}`}>
                Synthesized Voice
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <select
                  value={selectedVoiceUri}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className={`flex-1 text-xs h-10 px-3 rounded-lg border focus:outline-none ${themeStyles.inputBg}`}
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isTestingVoice}
                  onClick={handleTestVoice}
                  className={`h-10 px-4 text-xs gap-1.5 shrink-0 ${themeStyles.badgeBg}`}
                >
                  <Play className={`w-3.5 h-3.5 ${isTestingVoice ? "animate-pulse" : ""}`} />
                  <span>{isTestingVoice ? "Testing..." : "Test Voice"}</span>
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Download / Chrome Standalone App */}
        <section
          className={`rounded-2xl p-4 sm:p-6 border shadow-xs space-y-4 transition-colors ${themeStyles.cardBg}`}
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif text-base font-semibold">Chrome & Mobile App</h3>
          </div>
          <p className={`text-xs font-sans leading-relaxed ${themeStyles.subText}`}>
            Download and install The Reading Nook directly from Chrome or Safari to run in its own
            frameless standalone window on phone or desktop. Operates 100% offline.
          </p>

          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t ${themeStyles.divider}`}
          >
            <div className="flex items-center gap-2 text-xs">
              <Download className="w-4 h-4 text-amber-600 shrink-0" />
              <span className={themeStyles.subText}>
                Android Chrome, Desktop Chrome, iOS Safari & Chromebook
              </span>
            </div>

            <PWAInstallButton
              variant="settings"
              theme={preferences.theme}
              className="w-full sm:w-auto justify-center"
            />
          </div>
        </section>

        {/* Local Storage & Cache */}
        <section
          className={`rounded-2xl p-4 sm:p-6 border shadow-xs space-y-4 transition-colors ${themeStyles.cardBg}`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif text-base font-semibold">Storage & Data Management</h3>
          </div>
          <p className={`text-xs font-sans leading-relaxed ${themeStyles.subText}`}>
            Your books, reflowable chapters, reading progress, and annotations are saved exclusively
            on your device via IndexedDB.
          </p>

          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t ${themeStyles.divider}`}
          >
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className={themeStyles.subText}>
                Local Device Storage: Active · {booksCount} {booksCount === 1 ? "book" : "books"}{" "}
                stored
              </span>
            </div>

            <Button
              id="btn-reset-cache"
              variant="outline"
              size="sm"
              disabled={isClearing}
              onClick={handleResetLibrary}
              className="text-red-600 border-red-200/80 hover:bg-red-500/10 text-xs gap-1.5 shrink-0 w-full sm:w-auto justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? "Clearing..." : "Clear All Books & Reset"}</span>
            </Button>
          </div>
        </section>

        {/* Quiet footer note */}
        <div className="text-center pt-2 pb-6 space-y-1">
          <p className={`font-serif text-xs ${themeStyles.subText}`}>
            Lumen · A quiet personal e-reader & digital bookshelf
          </p>
          <p className="font-sans text-[10px] opacity-60">
            Designed with natural paper tones and timeless typographic proportions
          </p>
        </div>
      </main>
    </div>
  );
}

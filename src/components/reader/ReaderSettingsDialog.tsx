import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Preferences } from "@/lib/library";
import { Sun, Moon, BookOpen, Check } from "lucide-react";

interface ReaderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: Preferences;
  onUpdatePreferences: (patch: Partial<Preferences>) => void;
}

export function ReaderSettingsDialog({
  open,
  onOpenChange,
  preferences,
  onUpdatePreferences,
}: ReaderSettingsDialogProps) {
  const isDark = preferences.theme === "dark";
  const isCream = preferences.theme === "cream";

  const dialogStyles = isDark
    ? "bg-[#1e1c1a] border-[#36332f] text-[#ede8df]"
    : isCream
      ? "bg-[#f5efe6] border-[#dfd6c4] text-[#2b241a]"
      : "bg-[#faf8f5] border-[#e8e4dc] text-[#24201c]";

  const subTextStyle = isDark ? "text-stone-400" : "text-stone-600";
  const badgeStyle = isDark
    ? "bg-stone-800 text-stone-300 border-stone-700"
    : "bg-stone-100 text-stone-700 border-stone-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md border shadow-2xl p-5 sm:p-6 ${dialogStyles}`}>
        <DialogHeader>
          <DialogTitle className="font-serif text-lg tracking-tight">
            Reading Atmosphere
          </DialogTitle>
          <DialogDescription className={`text-xs ${subTextStyle}`}>
            Personalize typography and contrast for comfortable prolonged reading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Theme Palette */}
          <div className="space-y-2">
            <Label
              className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${subTextStyle}`}
            >
              Paper Palette
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-theme-paper"
                type="button"
                onClick={() => onUpdatePreferences({ theme: "paper" })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  preferences.theme === "paper"
                    ? "border-amber-700 ring-2 ring-amber-700/30 shadow-xs"
                    : "border-stone-300/80 hover:border-stone-400"
                }`}
                style={{ backgroundColor: "#fcfbf8", color: "#1f1e1c" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-serif font-medium">Paper</span>
                </div>
                <span className="text-[10px] opacity-70">Natural Ivory</span>
              </button>

              <button
                id="btn-theme-cream"
                type="button"
                onClick={() => onUpdatePreferences({ theme: "cream" })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  preferences.theme === "cream"
                    ? "border-amber-700 ring-2 ring-amber-700/30 shadow-xs"
                    : "border-stone-300/80 hover:border-stone-400"
                }`}
                style={{ backgroundColor: "#f7f4ec", color: "#24201a" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Sun className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-serif font-medium">Cream</span>
                </div>
                <span className="text-[10px] opacity-70">Warm Sepia</span>
              </button>

              <button
                id="btn-theme-dark"
                type="button"
                onClick={() => onUpdatePreferences({ theme: "dark" })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  preferences.theme === "dark"
                    ? "border-amber-500 ring-2 ring-amber-500/30 shadow-xs"
                    : "border-stone-700 hover:border-stone-600"
                }`}
                style={{ backgroundColor: "#181716", color: "#ede8df" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-serif font-medium">Night</span>
                </div>
                <span className="text-[10px] opacity-70">Charcoal Dark</span>
              </button>
            </div>
          </div>

          {/* Typeface */}
          <div className="space-y-2">
            <Label
              className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${subTextStyle}`}
            >
              Typeface
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                id="btn-font-serif"
                type="button"
                variant={preferences.font_family === "serif" ? "default" : "outline"}
                className={`h-11 justify-between font-serif text-sm rounded-xl ${
                  preferences.font_family === "serif"
                    ? "bg-stone-900 text-stone-100 hover:bg-stone-800"
                    : `${badgeStyle} hover:opacity-90`
                }`}
                onClick={() => onUpdatePreferences({ font_family: "serif" })}
              >
                <span>Literata Serif</span>
                {preferences.font_family === "serif" && (
                  <Check className="w-4 h-4 text-amber-500" />
                )}
              </Button>

              <Button
                id="btn-font-sans"
                type="button"
                variant={preferences.font_family === "sans" ? "default" : "outline"}
                className={`h-11 justify-between font-sans text-sm rounded-xl ${
                  preferences.font_family === "sans"
                    ? "bg-stone-900 text-stone-100 hover:bg-stone-800"
                    : `${badgeStyle} hover:opacity-90`
                }`}
                onClick={() => onUpdatePreferences({ font_family: "sans" })}
              >
                <span>Work Sans</span>
                {preferences.font_family === "sans" && <Check className="w-4 h-4 text-amber-500" />}
              </Button>
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <Label
                className={`font-sans font-medium uppercase tracking-wider text-[11px] ${subTextStyle}`}
              >
                Text Size
              </Label>
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                {preferences.font_size}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-serif opacity-60">A</span>
              <Slider
                id="slider-font-size"
                min={14}
                max={28}
                step={1}
                value={[preferences.font_size]}
                onValueChange={([val]) => onUpdatePreferences({ font_size: val })}
                className="flex-1 py-2"
              />
              <span className="text-base font-serif font-bold">A</span>
            </div>
          </div>

          {/* Line Spacing */}
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <Label
                className={`font-sans font-medium uppercase tracking-wider text-[11px] ${subTextStyle}`}
              >
                Line Spacing
              </Label>
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                {preferences.line_height.toFixed(1)}x
              </span>
            </div>
            <Slider
              id="slider-line-height"
              min={1.3}
              max={2.4}
              step={0.1}
              value={[preferences.line_height]}
              onValueChange={([val]) => onUpdatePreferences({ line_height: val })}
              className="py-2"
            />
          </div>

          {/* Margin Width */}
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <Label
                className={`font-sans font-medium uppercase tracking-wider text-[11px] ${subTextStyle}`}
              >
                Page Margins
              </Label>
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                {preferences.margin <= 16
                  ? "Compact (16px)"
                  : preferences.margin <= 28
                    ? "Normal (24px)"
                    : "Spacious (48px)"}
              </span>
            </div>
            <Slider
              id="slider-margin"
              min={12}
              max={48}
              step={4}
              value={[preferences.margin]}
              onValueChange={([val]) => onUpdatePreferences({ margin: val })}
              className="py-2"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

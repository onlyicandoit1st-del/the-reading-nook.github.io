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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-stone-50 border-stone-200 text-stone-900">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg tracking-tight text-stone-900">
            Reading Atmosphere
          </DialogTitle>
          <DialogDescription className="text-stone-600 text-xs">
            Personalize typography and contrast for comfortable prolonged reading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Theme Palette */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Paper Palette
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-theme-paper"
                type="button"
                onClick={() => onUpdatePreferences({ theme: "paper" })}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  preferences.theme === "paper"
                    ? "border-amber-800 ring-2 ring-amber-800/20 shadow-sm"
                    : "border-stone-200 hover:border-stone-300"
                }`}
                style={{ backgroundColor: "#fcfbf8", color: "#1f1e1c" }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Paper</span>
                </div>
                <span className="text-[10px] opacity-70">Natural White</span>
              </button>

              <button
                id="btn-theme-cream"
                type="button"
                onClick={() => onUpdatePreferences({ theme: "cream" })}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  preferences.theme === "cream"
                    ? "border-amber-800 ring-2 ring-amber-800/20 shadow-sm"
                    : "border-stone-300 hover:border-stone-400"
                }`}
                style={{ backgroundColor: "#f7f4ec", color: "#24201a" }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Sun className="w-4 h-4 text-amber-700" />
                  <span>Cream</span>
                </div>
                <span className="text-[10px] opacity-70">Warm Sepia</span>
              </button>

              <button
                id="btn-theme-dark"
                type="button"
                onClick={() => onUpdatePreferences({ theme: "dark" })}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  preferences.theme === "dark"
                    ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                    : "border-stone-700 hover:border-stone-600"
                }`}
                style={{ backgroundColor: "#1a1918", color: "#ebe6df" }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Moon className="w-4 h-4 text-amber-300" />
                  <span>Night</span>
                </div>
                <span className="text-[10px] opacity-70">Charcoal Dark</span>
              </button>
            </div>
          </div>

          {/* Typeface */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Typeface
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                id="btn-font-serif"
                type="button"
                variant={preferences.font_family === "serif" ? "default" : "outline"}
                className={`h-11 justify-between font-serif text-sm ${
                  preferences.font_family === "serif"
                    ? "bg-stone-900 text-stone-100 hover:bg-stone-800"
                    : "border-stone-200 text-stone-800 bg-white"
                }`}
                onClick={() => onUpdatePreferences({ font_family: "serif" })}
              >
                <span>Literata Serif</span>
                {preferences.font_family === "serif" && <Check className="w-4 h-4" />}
              </Button>

              <Button
                id="btn-font-sans"
                type="button"
                variant={preferences.font_family === "sans" ? "default" : "outline"}
                className={`h-11 justify-between font-sans text-sm ${
                  preferences.font_family === "sans"
                    ? "bg-stone-900 text-stone-100 hover:bg-stone-800"
                    : "border-stone-200 text-stone-800 bg-white"
                }`}
                onClick={() => onUpdatePreferences({ font_family: "sans" })}
              >
                <span>Work Sans</span>
                {preferences.font_family === "sans" && <Check className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <Label className="font-semibold uppercase tracking-wider text-stone-500">
                Text Size
              </Label>
              <span className="text-stone-700 font-mono text-xs">{preferences.font_size}px</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-serif text-stone-400">A</span>
              <Slider
                id="slider-font-size"
                min={15}
                max={28}
                step={1}
                value={[preferences.font_size]}
                onValueChange={([val]) => onUpdatePreferences({ font_size: val })}
                className="flex-1"
              />
              <span className="text-lg font-serif text-stone-700 font-bold">A</span>
            </div>
          </div>

          {/* Line Spacing */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <Label className="font-semibold uppercase tracking-wider text-stone-500">
                Line Spacing
              </Label>
              <span className="text-stone-700 font-mono text-xs">
                {preferences.line_height.toFixed(1)}x
              </span>
            </div>
            <Slider
              id="slider-line-height"
              min={1.4}
              max={2.4}
              step={0.1}
              value={[preferences.line_height]}
              onValueChange={([val]) => onUpdatePreferences({ line_height: val })}
            />
          </div>

          {/* Margin Width */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <Label className="font-semibold uppercase tracking-wider text-stone-500">
                Page Margins
              </Label>
              <span className="text-stone-700 font-mono text-xs">
                {preferences.margin <= 16
                  ? "Compact"
                  : preferences.margin <= 28
                    ? "Normal"
                    : "Spacious"}
              </span>
            </div>
            <Slider
              id="slider-margin"
              min={12}
              max={48}
              step={4}
              value={[preferences.margin]}
              onValueChange={([val]) => onUpdatePreferences({ margin: val })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

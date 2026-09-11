import React, { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Monitor, CheckCircle, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PWAInstallButtonProps {
  variant?: "header" | "card" | "settings";
  theme?: "paper" | "cream" | "dark";
  className?: string;
}

export function PWAInstallButton({
  variant = "header",
  theme = "paper",
  className = "",
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed desktop or mobile app
  if (isInstalled) {
    if (variant === "settings") {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-200/50">
          <CheckCircle className="w-4 h-4" />
          <span>Installed as standalone Chrome app</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  const isDark = theme === "dark";

  // Header compact pill button
  if (variant === "header") {
    return (
      <>
        <button
          id="btn-pwa-install-header"
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-sans font-medium border transition-all duration-200 shadow-2xs ${
            isDark
              ? "bg-[#2a241e] border-[#423a31] text-amber-200 hover:bg-[#382f27]"
              : "bg-[#f5efe6] border-[#dfd6c4] text-[#2b241a] hover:bg-[#eae1d0]"
          } ${className}`}
          title="Download app to desktop or mobile home screen"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showGuide && <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  // Settings view button
  return (
    <>
      <Button
        id="btn-pwa-install-settings"
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className={`text-xs gap-2 font-sans ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-amber-600" />
        <span>Install on Chrome / Desktop</span>
      </Button>

      {showGuide && <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />}
    </>
  );
}

function InstallGuideModal({ isIOS, onClose }: { isIOS: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#faf8f5] text-[#24201c] p-6 shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-800" />
            <h3 className="font-serif font-semibold text-base">Download from Chrome</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-stone-700">
            <p className="leading-relaxed">To install on your iPhone or iPad:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-600">
              <li>
                Tap the <strong>Share</strong> button (square with arrow) in Safari/Chrome.
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong>Add</strong> in the top-right corner.
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-stone-700">
            <p className="leading-relaxed">
              Google Chrome lets you download and install this app directly as a standalone desktop
              or mobile app:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-600">
              <li>
                Look at the <strong>Chrome address bar</strong> (on the right) for the{" "}
                <strong>Install</strong> icon (an icon with a computer or ⊕).
              </li>
              <li>
                Or click Chrome&apos;s <strong>three dots (⋮)</strong> menu in the upper right.
              </li>
              <li>
                Select <strong>Save and share</strong> → <strong>Install The Reading Nook</strong>.
              </li>
            </ol>
            <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/80">
              Once installed, the app launches from your desktop, dock, or home screen and works
              100% offline!
            </p>
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-[#24201c] hover:bg-stone-800 text-[#faf8f5] text-xs h-9"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-stone-900/90 text-stone-100 px-3.5 py-2 text-xs font-sans shadow-lg backdrop-blur-xs border border-stone-700 animate-in fade-in"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — All books and progress saved locally</span>
    </div>
  );
}

import React from "react";
import { Search, Settings } from "lucide-react";

interface BottomNavProps {
  activeTab: "library" | "search" | "settings";
  onChangeTab: (tab: "library" | "search" | "settings") => void;
  theme?: "paper" | "cream" | "dark";
}

export function BottomNav({ activeTab, onChangeTab, theme = "paper" }: BottomNavProps) {
  const isDark = theme === "dark";
  const isCream = theme === "cream";

  const navItems = [
    {
      id: "library" as const,
      label: "Library",
      icon: (
        // Custom bookshelf spine icon matching the reference aesthetic
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <rect x="3" y="4" width="3" height="12" rx="0.5" />
          <rect x="7.5" y="3" width="3" height="13" rx="0.5" />
          <rect x="12" y="5" width="3" height="11" rx="0.5" />
        </svg>
      ),
    },
    {
      id: "search" as const,
      label: "Search",
      icon: <Search className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: <Settings className="w-5 h-5 stroke-[1.8]" />,
    },
  ];

  const navBg = isDark
    ? "bg-[#181716]/95 border-[#36332f] text-[#ede8df]"
    : isCream
      ? "bg-[#f4eee3]/95 border-[#dfd6c4] text-[#2b241a]"
      : "bg-[#faf8f5]/95 border-[#ebe6de] text-[#23201c]";

  const activePill = isDark
    ? "bg-stone-800/90 text-amber-300 font-semibold shadow-2xs"
    : isCream
      ? "bg-[#ede3cf] text-[#2b241a] font-semibold shadow-2xs"
      : "bg-[#f0ebe2] text-[#23201c] font-semibold shadow-2xs";

  const inactiveText = isDark
    ? "text-stone-400 hover:text-stone-200"
    : "text-stone-500 hover:text-stone-800";

  return (
    <nav
      id="bottom-nav-bar"
      aria-label="Main Navigation"
      className={`fixed bottom-0 inset-x-0 z-40 backdrop-blur-md border-t shadow-xs transition-colors duration-200 ${navBg} pb-[env(safe-area-inset-bottom,0px)]`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-row items-center justify-center gap-2 px-4 py-2 min-h-[44px] min-w-[90px] rounded-full transition-all duration-200 active:scale-95 select-none ${
                isActive ? activePill : inactiveText
              }`}
            >
              <span
                className={`shrink-0 ${isActive ? "scale-105" : "opacity-75"} transition-transform`}
              >
                {item.icon}
              </span>
              <span className="text-xs font-serif tracking-wide font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

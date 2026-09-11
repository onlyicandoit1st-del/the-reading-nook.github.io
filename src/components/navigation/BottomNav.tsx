import React from "react";
import { BookOpen, Search, Settings, BookMarked } from "lucide-react";

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
        // Custom bookshelf spine icon matching the reference image
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <rect x="3" y="4" width="3" height="12" rx="0.5" />
          <rect x="7.5" y="3" width="3" height="13" rx="0.5" />
          <rect x="12" y="5" width="3" height="11" rx="0.5" />
        </svg>
      ),
    },
    {
      id: "search" as const,
      label: "Search",
      icon: <Search className="w-4 h-4 stroke-[1.8]" />,
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: <Settings className="w-4 h-4 stroke-[1.8]" />,
    },
  ];

  const navBg = isDark
    ? "bg-[#181716]/95 border-[#36332f] text-[#ede8df]"
    : isCream
      ? "bg-[#f4eee3]/95 border-[#dfd6c4] text-[#2b241a]"
      : "bg-[#faf8f5]/95 border-[#ebe6de] text-[#23201c]";

  const activeText = isDark ? "text-[#ede8df]" : isCream ? "text-[#2b241a]" : "text-[#23201c]";
  const inactiveText = isDark
    ? "text-stone-500 hover:text-stone-300"
    : "text-stone-400 hover:text-stone-700";
  const activeIcon = isDark ? "text-amber-500" : isCream ? "text-amber-700" : "text-[#c68a4c]";

  return (
    <nav
      id="bottom-nav-bar"
      className={`fixed bottom-0 inset-x-0 z-30 backdrop-blur-md border-t shadow-xs transition-colors duration-200 ${navBg}`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-14 px-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                isActive ? `${activeText} font-medium` : inactiveText
              }`}
            >
              <span className={isActive ? activeIcon : "opacity-60"}>{item.icon}</span>
              <span className="text-xs font-serif tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

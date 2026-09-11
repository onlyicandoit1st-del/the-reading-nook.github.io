import React, { useState } from "react";
import type { Book, Progress } from "@/lib/library";
import { BookCover } from "@/components/books/BookCover";
import {
  Menu,
  Plus,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Search,
  Settings,
  X,
  Library,
  Sliders,
  Upload,
  Clock,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

interface LibraryViewProps {
  books: Book[];
  progressMap: Record<string, Progress>;
  onSelectBook: (book: Book) => void;
  onOpenUpload: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onNavigateTab: (tab: "library" | "search" | "settings") => void;
  theme?: "paper" | "cream" | "dark";
}

export function LibraryView({
  books,
  progressMap,
  onSelectBook,
  onOpenUpload,
  onOpenProfile,
  onOpenSettings,
  onNavigateTab,
  theme = "paper",
}: LibraryViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamic greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning.";
    if (hour < 17) return "Good afternoon.";
    return "Good evening.";
  };

  // Find featured book: prioritize actively read book with progress or recent read timestamp
  const featuredBook =
    books.find((b) => {
      const p = progressMap[b.id];
      return p && p.percent > 0 && p.percent < 1;
    }) ||
    books.find((b) => b.last_read_at) ||
    books[0];

  const featuredProgress = featuredBook ? progressMap[featuredBook.id] : null;
  const featuredPercent = featuredProgress ? Math.round(featuredProgress.percent * 100) : 0;

  // Remaining books partitioned cleanly
  const otherBooks = books.filter((b) => b.id !== featuredBook?.id);
  const bookshelfBooks = otherBooks.slice(0, 4);
  const recentlyAddedBooks = otherBooks.slice(4, 8);

  const isDark = theme === "dark";
  const isCream = theme === "cream";

  const rootBg = isDark
    ? "bg-[#181716] text-[#ede8df]"
    : isCream
      ? "bg-[#f4eee3] text-[#2b241a]"
      : "bg-[#faf8f5] text-[#23201c]";

  const textPrimary = isDark ? "text-[#ede8df]" : isCream ? "text-[#2b241a]" : "text-[#23201c]";

  const textSecondary = isDark ? "text-stone-400" : isCream ? "text-[#7c6f5e]" : "text-stone-500";

  const cardBorder = isDark
    ? "border-[#36332f] bg-[#22201e]"
    : isCream
      ? "border-[#dfd6c4] bg-[#faf6ee]"
      : "border-stone-200/90 bg-white";

  const actionBtnBg = isDark
    ? "bg-[#2a2724] hover:bg-[#38332e] text-[#ede8df] border-[#3f3b35]"
    : isCream
      ? "bg-[#ede3cf] hover:bg-[#e4d7be] text-[#2b241a] border-[#dfd6c4]"
      : "bg-stone-200/80 hover:bg-stone-200 text-stone-800 border-stone-300/60";

  const drawerBg = isDark
    ? "bg-[#1e1c1a] text-[#ede8df] border-[#36332f]"
    : isCream
      ? "bg-[#f4eee3] text-[#2b241a] border-[#dfd6c4]"
      : "bg-[#faf8f5] text-[#23201c] border-stone-200";

  return (
    <div
      id="library-screen"
      className={`min-h-screen pb-28 select-none transition-colors duration-200 ${rootBg}`}
    >
      {/* Top Header Bar */}
      <header className="max-w-3xl mx-auto px-4 sm:px-8 pt-5 sm:pt-7 pb-3 sm:pb-4 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2">
          <span className="text-amber-700 text-base font-serif leading-none select-none">✳</span>
          <span
            className={`font-serif tracking-[0.22em] text-xs sm:text-sm font-semibold uppercase ${textPrimary}`}
          >
            Lumen
          </span>
        </div>

        {/* Action cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton variant="header" theme={theme} />

          {/* Avatar button */}
          <button
            id="btn-header-avatar"
            type="button"
            onClick={onOpenProfile}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2a241e] text-[#f5efe6] flex items-center justify-center font-serif text-xs font-medium border border-[#423a31] shadow-xs active:scale-95 transition-transform"
            title="Reading Profile"
          >
            {typeof window !== "undefined"
              ? (localStorage.getItem("lumen_user_name") || "Reader")
                  .trim()
                  .charAt(0)
                  .toUpperCase() || "R"
              : "R"}
          </button>

          {/* Separator */}
          <div className="h-4 w-px bg-current opacity-20" />

          {/* Hamburger Menu button */}
          <button
            id="btn-header-menu"
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className={`p-2 rounded-lg transition-colors active:scale-95 ${textSecondary} hover:opacity-100`}
            title="Menu"
          >
            <Menu className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Plus / Add Book button */}
          <button
            id="btn-header-add-book"
            type="button"
            onClick={onOpenUpload}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all border shadow-2xs active:scale-95 ${actionBtnBg}`}
            title="Add Book"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* Main Reading Shelf Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-8 pt-3 sm:pt-4 space-y-8 sm:space-y-12">
        {/* Greeting Section */}
        <section id="greeting-section" className="space-y-1">
          <h1
            className={`font-serif text-2xl sm:text-4xl ${textPrimary} font-normal tracking-tight`}
          >
            {getGreeting()}
          </h1>
          <p className={`font-sans text-xs sm:text-sm ${textSecondary} font-normal`}>
            {books.length > 0 ? "Continue where you left off." : "Your personal reading sanctuary."}
          </p>
        </section>

        {/* Continue Reading Featured Book */}
        {featuredBook ? (
          <section id="continue-reading-section">
            <div
              className={`p-4 sm:p-6 rounded-2xl border shadow-xs transition-all duration-200 ${cardBorder}`}
            >
              <div className="flex flex-row items-center gap-4 sm:gap-8">
                {/* Featured Book Cover */}
                <div
                  onClick={() => onSelectBook(featuredBook)}
                  className="cursor-pointer group shrink-0 transform active:scale-98 hover:-translate-y-0.5 transition-all duration-200 w-24 sm:w-44"
                >
                  <BookCover book={featuredBook} size="md" />
                </div>

                {/* Book Details & Progress */}
                <div className="flex-1 flex flex-col justify-between py-1 space-y-2.5 sm:space-y-4 min-w-0">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-wider text-amber-700 uppercase">
                      In Progress
                    </span>
                    <h2
                      onClick={() => onSelectBook(featuredBook)}
                      className={`font-serif text-base sm:text-2xl ${textPrimary} font-medium tracking-tight cursor-pointer hover:text-amber-700 transition-colors line-clamp-2 leading-snug`}
                    >
                      {featuredBook.title}
                    </h2>
                    <p
                      className={`font-sans text-[11px] sm:text-xs tracking-wider uppercase ${textSecondary} font-medium truncate`}
                    >
                      {featuredBook.author || "Unknown Author"}
                    </p>
                  </div>

                  {/* Progress bar line with percentage */}
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-sans text-[11px] sm:text-xs ${textSecondary}`}>
                        {featuredPercent > 0 ? `${featuredPercent}% finished` : "Not started"}
                      </span>
                      {featuredProgress && (
                        <span className="font-mono text-[10px] sm:text-[11px] text-amber-700">
                          Ch. {featuredProgress.chapter_idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-stone-200/60 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-700 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(featuredPercent, 2)}%` }}
                      />
                    </div>
                  </div>

                  {/* Continue reading button */}
                  <div className="pt-1">
                    <button
                      id="btn-continue-reading-link"
                      type="button"
                      onClick={() => onSelectBook(featuredBook)}
                      className={`inline-flex items-center gap-1.5 font-serif text-xs sm:text-sm font-medium ${textPrimary} hover:text-amber-700 transition-colors group active:scale-95`}
                    >
                      <span>{featuredPercent > 0 ? "Continue reading" : "Start reading"}</span>
                      <span className="font-sans text-amber-700 group-hover:translate-x-1 transition-transform text-sm sm:text-base">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Empty Library State */
          <div
            id="empty-library-state"
            className={`py-12 sm:py-16 px-4 sm:px-6 text-center border border-dashed rounded-2xl space-y-4 ${cardBorder}`}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-700">
              <BookOpen className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className={`font-serif text-lg sm:text-xl font-medium ${textPrimary}`}>
                Your Bookshelf is Waiting
              </h3>
              <p className={`font-sans text-xs ${textSecondary} leading-relaxed`}>
                Import your own eBooks (PDF, TXT, or Markdown) to begin reading in quiet offline
                focus.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={onOpenUpload}
                className="bg-[#24201c] hover:bg-stone-800 text-[#faf8f5] text-xs h-10 px-5 rounded-xl font-sans gap-2 active:scale-95 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Book</span>
              </Button>
            </div>
          </div>
        )}

        {/* BOOKSHELF Section */}
        {bookshelfBooks.length > 0 && (
          <section id="section-bookshelf" className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3
                className={`font-sans text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase ${textPrimary}`}
              >
                Bookshelf
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("search")}
                className={`font-sans text-xs ${textSecondary} hover:opacity-100 flex items-center gap-0.5 transition-colors p-1`}
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {bookshelfBooks.map((book) => {
                const prog = progressMap[book.id];
                const pct = prog ? Math.round(prog.percent * 100) : 0;
                return (
                  <div
                    key={book.id}
                    onClick={() => onSelectBook(book)}
                    className="cursor-pointer group flex flex-col space-y-2 active:scale-98 transition-transform"
                  >
                    <div className="transform group-hover:-translate-y-1 transition-transform duration-200">
                      <BookCover book={book} size="md" />
                    </div>
                    <div className="space-y-0.5 px-0.5">
                      <h4
                        className={`font-serif text-xs font-medium ${textPrimary} group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug`}
                      >
                        {book.title}
                      </h4>
                      <p className={`font-sans text-[11px] ${textSecondary} truncate`}>
                        {book.author || "Unknown"}
                      </p>
                      {pct > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-700 font-mono pt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* RECENTLY ADDED Section */}
        {recentlyAddedBooks.length > 0 && (
          <section id="section-recently-added" className="space-y-3 sm:space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3
                className={`font-sans text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase ${textPrimary}`}
              >
                Recently Added
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("search")}
                className={`font-sans text-xs ${textSecondary} hover:opacity-100 flex items-center gap-0.5 transition-colors p-1`}
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {recentlyAddedBooks.map((book) => {
                const prog = progressMap[book.id];
                const pct = prog ? Math.round(prog.percent * 100) : 0;
                return (
                  <div
                    key={book.id}
                    onClick={() => onSelectBook(book)}
                    className="cursor-pointer group flex flex-col space-y-2 active:scale-98 transition-transform"
                  >
                    <div className="transform group-hover:-translate-y-1 transition-transform duration-200">
                      <BookCover book={book} size="md" />
                    </div>
                    <div className="space-y-0.5 px-0.5">
                      <h4
                        className={`font-serif text-xs font-medium ${textPrimary} group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug`}
                      >
                        {book.title}
                      </h4>
                      <p className={`font-sans text-[11px] ${textSecondary} truncate`}>
                        {book.author || "Unknown"}
                      </p>
                      {pct > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-700 font-mono pt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Side Menu Drawer */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className={`w-[85vw] max-w-xs p-6 space-y-6 ${drawerBg}`}>
          <SheetHeader className="text-left space-y-1 pb-4 border-b border-current opacity-20">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 text-sm font-serif leading-none">✳</span>
              <SheetTitle
                className={`font-serif tracking-[0.2em] text-sm uppercase ${textPrimary}`}
              >
                Lumen Shelf
              </SheetTitle>
            </div>
            <p className={`text-xs font-sans ${textSecondary}`}>Quiet Personal Reader</p>
          </SheetHeader>

          <div className="space-y-1.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onNavigateTab("library");
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl text-xs font-serif hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between min-h-[44px] active:scale-98 transition-all"
            >
              <span>Library Shelf</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onNavigateTab("search");
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl text-xs font-serif hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between min-h-[44px] active:scale-98 transition-all"
            >
              <span>Search & Shelves</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenUpload();
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl text-xs font-serif hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between min-h-[44px] active:scale-98 transition-all"
            >
              <span>Add Book (PDF / TXT)</span>
              <Plus className="w-3.5 h-3.5 opacity-50" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl text-xs font-serif hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between min-h-[44px] active:scale-98 transition-all"
            >
              <span>Reading Preferences</span>
              <Sliders className="w-3.5 h-3.5 opacity-50" />
            </button>
          </div>

          <div className="pt-8 border-t border-current opacity-20 text-center space-y-1">
            <p className="text-[11px] font-serif opacity-70">The Reading Nook · Lumen</p>
            <p className="text-[10px] font-sans opacity-50">Offline local reading sanctuary</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

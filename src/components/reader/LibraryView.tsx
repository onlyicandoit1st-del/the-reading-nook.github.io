import React, { useState } from "react";
import type { Book, Progress } from "@/lib/library";
import { BookCover } from "@/components/books/BookCover";
import {
  Menu,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
  BookOpen,
  Search,
  Settings,
  X,
  Library,
  Sliders,
  Upload,
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

  return (
    <div
      id="library-screen"
      className={`min-h-screen pb-28 select-none transition-colors duration-200 ${rootBg}`}
    >
      {/* Top Header Bar matching reference image */}
      <header className="max-w-3xl mx-auto px-6 sm:px-8 pt-7 pb-4 flex items-center justify-between">
        {/* Brand identity: asterisk/sparkle + LUMEN */}
        <div className="flex items-center gap-2">
          <span className="text-amber-800 text-sm font-serif leading-none select-none">✳</span>
          <span className="font-serif tracking-[0.22em] text-xs sm:text-sm font-semibold uppercase text-[#23201c]">
            Lumen
          </span>
        </div>

        {/* Minimal action cluster: Install app, Profile avatar, divider, hamburger menu, add button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <PWAInstallButton variant="header" theme={theme} />

          {/* Avatar button */}
          <button
            id="btn-header-avatar"
            type="button"
            onClick={onOpenProfile}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2a241e] text-[#f5efe6] flex items-center justify-center font-serif text-xs font-medium border border-[#423a31] shadow-xs focus:outline-none hover:opacity-85 transition-opacity select-none"
            title="Reading Profile"
          >
            {typeof window !== "undefined"
              ? (localStorage.getItem("lumen_user_name") || "Reader")
                  .trim()
                  .charAt(0)
                  .toUpperCase() || "R"
              : "R"}
          </button>

          {/* Thin vertical separator */}
          <div className="h-4 w-px bg-stone-300" />

          {/* Hamburger Menu button */}
          <button
            id="btn-header-menu"
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="p-1 text-stone-700 hover:text-stone-900 transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Plus / Add Book button */}
          <button
            id="btn-header-add-book"
            type="button"
            onClick={onOpenUpload}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-200/70 hover:bg-stone-200 text-stone-800 flex items-center justify-center transition-colors shadow-2xs"
            title="Add Book"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* Main Reading Shelf Content */}
      <main className="max-w-3xl mx-auto px-6 sm:px-8 pt-4 space-y-12">
        {/* Greeting Section */}
        <section id="greeting-section" className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#23201c] font-normal tracking-tight">
            {getGreeting()}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-stone-500 font-normal">
            {books.length > 0 ? "Continue where you left off." : "Your personal reading sanctuary."}
          </p>
        </section>

        {/* Continue Reading Featured Book */}
        {featuredBook ? (
          <section id="continue-reading-section" className="pt-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-12">
              {/* Featured 3D Book Cover */}
              <div
                onClick={() => onSelectBook(featuredBook)}
                className="cursor-pointer group shrink-0 transform hover:-translate-y-1 transition-all duration-300"
              >
                <BookCover book={featuredBook} size="featured" />
              </div>

              {/* Book Details & Progress */}
              <div className="flex-1 flex flex-col justify-center text-center sm:text-left pt-2 sm:pt-4 space-y-4 min-w-0 w-full">
                <div className="space-y-1">
                  <h2
                    onClick={() => onSelectBook(featuredBook)}
                    className="font-serif text-2xl sm:text-3xl text-[#23201c] font-normal tracking-tight cursor-pointer hover:text-amber-900 transition-colors line-clamp-2"
                  >
                    {featuredBook.title}
                  </h2>
                  <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-500 font-medium truncate">
                    {featuredBook.author || "Unknown Author"}
                  </p>
                </div>

                {/* Progress bar line with percentage on the right */}
                <div className="pt-2 space-y-2 max-w-sm mx-auto sm:mx-0 w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-[2.5px] bg-[#eae5dc] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c68a4c] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(featuredPercent, 2)}%` }}
                      />
                    </div>
                    <span className="font-sans text-xs text-stone-500 shrink-0">
                      {featuredPercent}%
                    </span>
                  </div>
                </div>

                {/* Continue reading link with arrow */}
                <div className="pt-1">
                  <button
                    id="btn-continue-reading-link"
                    type="button"
                    onClick={() => onSelectBook(featuredBook)}
                    className="inline-flex items-center gap-2 font-serif text-sm text-[#23201c] hover:text-amber-800 transition-colors group"
                  >
                    <span>{featuredPercent > 0 ? "Continue reading" : "Start reading"}</span>
                    <span className="font-sans text-stone-400 group-hover:translate-x-1 group-hover:text-amber-800 transition-all text-base">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Empty Library State */
          <div
            id="empty-library-state"
            className="py-16 px-6 text-center border border-dashed border-stone-300 rounded-2xl bg-white/40 space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-amber-800">
              <BookOpen className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif text-xl font-normal text-stone-900">
                Your Bookshelf is Waiting
              </h3>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Import your own eBooks (EPUB, PDF, TXT, or Markdown) to begin reading in quiet
                focus.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={onOpenUpload}
                className="bg-[#24201c] hover:bg-stone-800 text-[#faf8f5] text-xs h-9 px-4 rounded-lg font-sans gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Book</span>
              </Button>
            </div>
          </div>
        )}

        {/* BOOKSHELF Section */}
        {bookshelfBooks.length > 0 && (
          <section id="section-bookshelf" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-stone-800">
                Bookshelf
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("search")}
                className="font-sans text-xs text-stone-500 hover:text-stone-800 flex items-center gap-0.5 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {bookshelfBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="cursor-pointer group flex flex-col space-y-2.5"
                >
                  <div className="transform group-hover:-translate-y-1 transition-transform duration-200">
                    <BookCover book={book} size="md" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-serif text-xs font-medium text-[#23201c] group-hover:text-amber-900 transition-colors line-clamp-1 leading-snug">
                      {book.title}
                    </h4>
                    <p className="font-sans text-[11px] text-stone-500 truncate">
                      {book.author || "Unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RECENTLY ADDED Section */}
        {recentlyAddedBooks.length > 0 && (
          <section id="section-recently-added" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-stone-800">
                Recently Added
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("search")}
                className="font-sans text-xs text-stone-500 hover:text-stone-800 flex items-center gap-0.5 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {recentlyAddedBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="cursor-pointer group flex flex-col space-y-2.5"
                >
                  <div className="transform group-hover:-translate-y-1 transition-transform duration-200">
                    <BookCover book={book} size="md" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-serif text-xs font-medium text-[#23201c] group-hover:text-amber-900 transition-colors line-clamp-1 leading-snug">
                      {book.title}
                    </h4>
                    <p className="font-sans text-[11px] text-stone-500 truncate">
                      {book.author || "Unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Side Menu Drawer */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="right"
          className="bg-[#faf8f5] text-[#23201c] border-l border-stone-200 w-80 p-6 space-y-6"
        >
          <SheetHeader className="text-left space-y-1 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-amber-800 text-sm font-serif leading-none">✳</span>
              <SheetTitle className="font-serif tracking-[0.2em] text-sm uppercase text-[#23201c]">
                Lumen Shelf
              </SheetTitle>
            </div>
            <p className="text-xs font-sans text-stone-500">Quiet Personal Reader</p>
          </SheetHeader>

          <div className="space-y-1 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onNavigateTab("library");
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-serif text-stone-800 hover:bg-stone-200/60 flex items-center justify-between"
            >
              <span>Library Shelf</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onNavigateTab("search");
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-serif text-stone-800 hover:bg-stone-200/60 flex items-center justify-between"
            >
              <span>Search & Shelves</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenUpload();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-serif text-stone-800 hover:bg-stone-200/60 flex items-center justify-between"
            >
              <span>Add Book (PDF / TXT)</span>
              <Plus className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-serif text-stone-800 hover:bg-stone-200/60 flex items-center justify-between"
            >
              <span>Reading Preferences</span>
              <Sliders className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-serif text-amber-900 bg-amber-50/70 hover:bg-amber-100/60 border border-amber-200/60 flex items-center justify-between"
            >
              <span>Download / Install App</span>
              <Upload className="w-3.5 h-3.5 text-amber-700 rotate-180" />
            </button>
          </div>

          <div className="pt-10 border-t border-stone-200 text-center space-y-1">
            <p className="text-[11px] font-serif text-stone-500">The Reading Nook · Lumen</p>
            <p className="text-[10px] font-sans text-stone-400">Offline local reading sanctuary</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

import React, { useState } from "react";
import type { Book, Progress } from "@/lib/library";
import { BookCover } from "@/components/books/BookCover";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X, BookOpen, Clock } from "lucide-react";

interface SearchViewProps {
  books: Book[];
  progressMap: Record<string, Progress>;
  onSelectBook: (book: Book) => void;
  theme?: "paper" | "cream" | "dark";
}

export function SearchView({ books, progressMap, onSelectBook, theme = "paper" }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const isDark = theme === "dark";
  const isCream = theme === "cream";

  const rootBg = isDark
    ? "bg-[#181716] text-[#ede8df]"
    : isCream
      ? "bg-[#f4eee3] text-[#2b241a]"
      : "bg-[#faf8f5] text-stone-900";

  const headerBg = isDark
    ? "bg-[#181716]/90 border-[#36332f]"
    : isCream
      ? "bg-[#f4eee3]/90 border-[#dfd6c4]"
      : "bg-white/70 border-stone-200/80";

  const cardBg = isDark
    ? "bg-[#22201e] border-[#36332f] text-[#ede8df] hover:border-amber-500/40"
    : isCream
      ? "bg-[#faf6ee] border-[#dfd6c4] text-[#2b241a] hover:border-amber-700/40"
      : "bg-white border-stone-200/80 text-stone-900 hover:border-amber-800/40";

  const inputBg = isDark
    ? "bg-[#22201e] border-[#36332f] text-[#ede8df]"
    : isCream
      ? "bg-white border-[#dfd6c4] text-[#2b241a]"
      : "bg-white border-stone-200 text-stone-900";

  const categories = [
    { id: "all", label: "All Books" },
    { id: "reading", label: "In Progress" },
    { id: "unread", label: "Unread" },
    { id: "shelf", label: "Bookshelf" },
    { id: "recent", label: "Recently Added" },
  ];

  const filteredBooks = books.filter((b) => {
    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.description && b.description.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    const prog = progressMap[b.id];
    if (activeCategory === "reading") {
      return prog && prog.percent > 0 && prog.percent < 0.99;
    }
    if (activeCategory === "unread") {
      return !prog || prog.percent === 0;
    }
    if (activeCategory === "shelf") {
      return b.collection_id === "bookshelf";
    }
    if (activeCategory === "recent") {
      return b.collection_id === "recently_added";
    }
    return true;
  });

  return (
    <div id="search-view" className={`min-h-screen pb-24 transition-colors duration-200 ${rootBg}`}>
      {/* Top Header */}
      <header
        className={`border-b backdrop-blur sticky top-0 z-20 px-6 py-5 transition-colors ${headerBg}`}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Search Library</h1>
            <span className="text-xs font-sans opacity-70">
              {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
            </span>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              id="input-main-search"
              type="text"
              placeholder="Search by title, author, or passage..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`pl-10 pr-10 h-11 text-sm rounded-xl shadow-xs focus:ring-1 focus:ring-amber-700 ${inputBg}`}
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans transition-colors shrink-0 ${
                  activeCategory === cat.id
                    ? isDark
                      ? "bg-amber-500 text-stone-950 font-medium"
                      : "bg-[#24201c] text-[#faf8f5] font-medium"
                    : isDark
                      ? "bg-[#272421] text-stone-300 hover:bg-[#332f2b]"
                      : "bg-stone-200/70 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Search Results Grid */}
      <main className="max-w-4xl mx-auto px-6 pt-8">
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBooks.map((book) => {
              const prog = progressMap[book.id];
              const percent = prog ? Math.round(prog.percent * 100) : 0;

              return (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group ${cardBg}`}
                >
                  <div className="w-16 shrink-0">
                    <BookCover book={book} size="sm" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-serif text-sm font-semibold transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs font-sans opacity-70 uppercase tracking-wider truncate">
                      {book.author || "Unknown Author"}
                    </p>
                    {percent > 0 ? (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-600 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{percent}% completed</span>
                      </div>
                    ) : (
                      <p className="text-[11px] opacity-60 font-sans pt-1">
                        {book.chapter_count} chapters
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 space-y-3">
            <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-serif text-stone-700 text-base">No books match your search</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try searching for a different keyword or browse through your collections in the
              library.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

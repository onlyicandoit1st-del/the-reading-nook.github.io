import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Book, Chapter, Preferences, Progress } from "@/lib/library";
import {
  listBooks,
  getChapters,
  getProgress,
  getPreferences,
  savePreferences,
  defaultPreferences,
} from "@/lib/library";
import { LibraryView } from "@/components/reader/LibraryView";
import { ReaderView } from "@/components/reader/ReaderView";
import { ListeningView } from "@/components/reader/ListeningView";
import { SearchView } from "@/components/reader/SearchView";
import { SettingsView } from "@/components/reader/SettingsView";
import { BookDetailsDialog } from "@/components/reader/BookDetailsDialog";
import { UploadBookDialog } from "@/components/reader/UploadBookDialog";
import { UserProfileDialog } from "@/components/reader/UserProfileDialog";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type MainTab = "library" | "search" | "settings";
type ActiveMode = "shelf" | "reader" | "listening";

function Index() {
  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  // Navigation states
  const [activeTab, setActiveTab] = useState<MainTab>("library");
  const [activeMode, setActiveMode] = useState<ActiveMode>("shelf");

  // Selected book context for reading / listening / details
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeChapters, setActiveChapters] = useState<Chapter[]>([]);
  const [activeProgress, setActiveProgress] = useState<Progress | null>(null);
  const [initialChapterIdx, setInitialChapterIdx] = useState<number>(0);

  // Dialogs
  const [detailsBook, setDetailsBook] = useState<Book | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Loading indicator
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingBook, setIsLoadingBook] = useState(false);

  // Load books, progress map, and preferences on mount
  useEffect(() => {
    async function init() {
      try {
        const [loadedBooks, loadedPrefs] = await Promise.all([listBooks(), getPreferences()]);
        setBooks(loadedBooks);
        setPreferences(loadedPrefs);

        // Fetch progress for each book
        const progEntries = await Promise.all(
          loadedBooks.map(async (b) => {
            const p = await getProgress(b.id);
            return [b.id, p] as const;
          }),
        );
        const map: Record<string, Progress> = {};
        for (const [id, p] of progEntries) {
          if (p) map[id] = p;
        }
        setProgressMap(map);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsInitializing(false);
      }
    }
    void init();
  }, []);

  // When user clicks a book on the shelf: open Book Details
  const handleSelectBook = (book: Book) => {
    setDetailsBook(book);
    setIsDetailsOpen(true);
  };

  // Launch Reader
  const handleStartReading = async (book: Book, chapterIdx: number = 0) => {
    setIsLoadingBook(true);
    setActiveBook(book);
    setInitialChapterIdx(chapterIdx);
    try {
      const [chaps, prog] = await Promise.all([getChapters(book.id), getProgress(book.id)]);
      setActiveChapters(chaps);
      setActiveProgress(prog);
      setActiveMode("reader");
    } catch (err) {
      console.error("Failed to load chapters:", err);
    } finally {
      setIsLoadingBook(false);
    }
  };

  // Launch Audio Listening
  const handleStartListening = async (book: Book, chapterIdx: number = 0) => {
    setIsLoadingBook(true);
    setActiveBook(book);
    setInitialChapterIdx(chapterIdx);
    try {
      const chaps = await getChapters(book.id);
      setActiveChapters(chaps);
      setActiveMode("listening");
    } catch (err) {
      console.error("Failed to load chapters for listening:", err);
    } finally {
      setIsLoadingBook(false);
    }
  };

  // Return to shelf
  const handleBackToShelf = () => {
    setActiveMode("shelf");
    setActiveBook(null);
    setActiveChapters([]);
    // Refresh book progress
    void listBooks().then(async (latest) => {
      setBooks(latest);
      const progEntries = await Promise.all(
        latest.map(async (b) => {
          const p = await getProgress(b.id);
          return [b.id, p] as const;
        }),
      );
      const map: Record<string, Progress> = {};
      for (const [id, p] of progEntries) {
        if (p) map[id] = p;
      }
      setProgressMap(map);
    });
  };

  const handleUpdatePreferences = (patch: Partial<Preferences>) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    void savePreferences(patch);
  };

  const handleBookAdded = (newBook: Book) => {
    setBooks((prev) => [newBook, ...prev.filter((b) => b.id !== newBook.id)]);
    handleStartReading(newBook, 0);
  };

  const handleBookDeleted = (deletedBook: Book) => {
    setBooks((prev) => prev.filter((b) => b.id !== deletedBook.id));
    setProgressMap((prev) => {
      const next = { ...prev };
      delete next[deletedBook.id];
      return next;
    });
    if (activeBook?.id === deletedBook.id) {
      setActiveBook(null);
      setActiveMode("shelf");
    }
  };

  const handleBookUpdated = (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    if (activeBook?.id === updatedBook.id) {
      setActiveBook(updatedBook);
    }
    setDetailsBook(updatedBook);
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] text-stone-700">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-amber-800" />
          <p className="font-serif text-xs text-stone-500 tracking-wide uppercase">
            Opening Lumen Bookshelf...
          </p>
        </div>
      </div>
    );
  }

  // Active Screen: Reader
  if (activeMode === "reader" && activeBook) {
    if (isLoadingBook) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] text-stone-700">
          <Loader2 className="w-5 h-5 animate-spin text-amber-800" />
        </div>
      );
    }
    return (
      <ReaderView
        book={activeBook}
        chapters={activeChapters}
        initialProgress={
          activeProgress ?? {
            book_id: activeBook.id,
            chapter_idx: initialChapterIdx,
            char_offset: 0,
            percent: 0,
            updated_at: new Date().toISOString(),
          }
        }
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        onBackToLibrary={handleBackToShelf}
      />
    );
  }

  // Active Screen: Listening (Audio)
  if (activeMode === "listening" && activeBook) {
    return (
      <ListeningView
        book={activeBook}
        chapters={activeChapters}
        initialChapterIdx={initialChapterIdx}
        onBack={handleBackToShelf}
        onOpenReader={(idx) => {
          setInitialChapterIdx(idx);
          setActiveMode("reader");
        }}
      />
    );
  }

  // Theme background
  const rootBg =
    preferences.theme === "dark"
      ? "bg-[#181716] text-[#ede8df]"
      : preferences.theme === "cream"
        ? "bg-[#f4eee3] text-[#2b241a]"
        : "bg-[#faf8f5] text-[#23201c]";

  // Active Screen: Shelf Tabs (Library, Search, Settings)
  return (
    <div className={`${rootBg} min-h-screen transition-colors duration-200`}>
      {activeTab === "library" && (
        <LibraryView
          books={books}
          progressMap={progressMap}
          onSelectBook={handleSelectBook}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setActiveTab("settings")}
          onNavigateTab={setActiveTab}
          theme={preferences.theme}
        />
      )}

      {activeTab === "search" && (
        <SearchView
          books={books}
          progressMap={progressMap}
          onSelectBook={handleSelectBook}
          theme={preferences.theme}
        />
      )}

      {activeTab === "settings" && (
        <SettingsView
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onOpenSignIn={() => setIsProfileOpen(true)}
          onNavigateTab={setActiveTab}
          booksCount={books.length}
          onLibraryReset={() => {
            setBooks([]);
            setProgressMap({});
            setActiveBook(null);
          }}
        />
      )}

      {/* Persistent Minimal Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} theme={preferences.theme} />

      {/* Book Details Modal */}
      <BookDetailsDialog
        book={detailsBook}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onStartReading={(b, idx) => handleStartReading(b, idx ?? 0)}
        onStartListening={(b, idx) => handleStartListening(b, idx ?? 0)}
        onBookDeleted={handleBookDeleted}
        onBookUpdated={handleBookUpdated}
      />

      {/* Add / Import Book Dialog */}
      <UploadBookDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onBookAdded={handleBookAdded}
        existingBookIds={books.map((b) => b.id)}
      />

      {/* User Reading Profile Dialog */}
      <UserProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        totalBooks={books.length}
      />
    </div>
  );
}

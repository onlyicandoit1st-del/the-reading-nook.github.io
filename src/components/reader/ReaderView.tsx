import React, { useState, useEffect, useRef } from "react";
import type {
  Book,
  Chapter,
  Preferences,
  Bookmark,
  Highlight,
  Note,
  Progress,
} from "@/lib/library";
import {
  saveProgress,
  listBookmarks,
  addBookmark,
  removeBookmark,
  listHighlights,
  addHighlight,
  removeHighlight,
  listNotes,
  addNote,
  removeNote,
} from "@/lib/library";
import { ReaderSettingsDialog } from "./ReaderSettingsDialog";
import { AudioPlayerBar } from "./AudioPlayerBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Sliders,
  Headphones,
  Bookmark as BookmarkIcon,
  Highlighter,
  Trash2,
  StickyNote,
  Check,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface ReaderViewProps {
  book: Book;
  chapters: Chapter[];
  initialProgress: Progress | null;
  preferences: Preferences;
  onUpdatePreferences: (patch: Partial<Preferences>) => void;
  onBackToLibrary: () => void;
}

export function ReaderView({
  book,
  chapters,
  initialProgress,
  preferences,
  onUpdatePreferences,
  onBackToLibrary,
}: ReaderViewProps) {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(initialProgress?.chapter_idx ?? 0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Dialogs & drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAudioBarOpen, setIsAudioBarOpen] = useState(false);
  const [activeSpokenText, setActiveSpokenText] = useState<string>("");

  // Floating selection menu
  const [selectionRange, setSelectionRange] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const [newNoteText, setNewNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Load annotations
  useEffect(() => {
    void listBookmarks(book.id).then(setBookmarks);
    void listHighlights(book.id).then(setHighlights);
    void listNotes(book.id).then(setNotes);
  }, [book.id]);

  const currentChapter = chapters[currentChapterIdx] ??
    chapters[0] ?? {
      idx: 0,
      title: "Chapter 1",
      content: "No content available.",
    };

  // Save progress when chapter changes
  useEffect(() => {
    const percent =
      chapters.length > 0 ? Math.round(((currentChapterIdx + 1) / chapters.length) * 100) / 100 : 1;
    void saveProgress(book.id, currentChapterIdx, 0, percent);
    // Scroll reading container to top on chapter change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [book.id, currentChapterIdx, chapters.length]);

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionRange(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setSelectionRange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionRange({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleCreateHighlight = async () => {
    if (!selectionRange) return;
    try {
      const created = await addHighlight({
        book_id: book.id,
        chapter_idx: currentChapterIdx,
        start_offset: 0,
        end_offset: selectionRange.text.length,
        color: "amber",
        text_snippet: selectionRange.text,
      });
      setHighlights((prev) => [...prev, created]);
      toast.success("Passage highlighted");
      window.getSelection()?.removeAllRanges();
      setSelectionRange(null);
    } catch {
      toast.error("Could not save highlight");
    }
  };

  const handleCreateNote = async () => {
    if (!selectionRange || !newNoteText.trim()) return;
    try {
      const note = await addNote({
        book_id: book.id,
        chapter_idx: currentChapterIdx,
        char_offset: 0,
        body: newNoteText.trim(),
      });
      setNotes((prev) => [...prev, note]);
      toast.success("Note saved");
      setNewNoteText("");
      setShowNoteInput(false);
      window.getSelection()?.removeAllRanges();
      setSelectionRange(null);
    } catch {
      toast.error("Could not save note");
    }
  };

  const handleToggleBookmark = async () => {
    const existing = bookmarks.find((b) => b.chapter_idx === currentChapterIdx);
    if (existing) {
      await removeBookmark(existing.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      toast.info("Bookmark removed");
    } else {
      const created = await addBookmark({
        book_id: book.id,
        chapter_idx: currentChapterIdx,
        char_offset: 0,
        label: currentChapter.title,
      });
      setBookmarks((prev) => [...prev, created]);
      toast.success("Bookmarked chapter");
    }
  };

  const isBookmarked = bookmarks.some((b) => b.chapter_idx === currentChapterIdx);

  // Theme styling calculation
  const themeClasses = {
    paper: "bg-[#fcfbf8] text-[#1f1e1c]",
    cream: "bg-[#f7f4ec] text-[#24201a]",
    dark: "bg-[#1a1918] text-[#ebe6df]",
  }[preferences.theme];

  const headerBorder = {
    paper: "border-[#ebe7df] bg-[#fcfbf8]/95",
    cream: "border-[#ede7d8] bg-[#f7f4ec]/95",
    dark: "border-[#2b2826] bg-[#1a1918]/95",
  }[preferences.theme];

  const fontFamilyClass = preferences.font_family === "sans" ? "font-sans" : "font-serif";

  // Split chapter into paragraphs
  const paragraphs = currentChapter.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div
      id="reader-view"
      data-reader={preferences.theme}
      className={`min-h-screen ${themeClasses} transition-colors duration-200`}
    >
      {/* Sticky Reader Header */}
      <header
        className={`sticky top-0 z-30 backdrop-blur border-b ${headerBorder} px-4 py-2.5 transition-colors`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Back to library & Chapter Info */}
          <div className="flex items-center gap-2 min-w-0">
            <Button
              id="btn-back-to-library"
              variant="ghost"
              size="sm"
              onClick={onBackToLibrary}
              className="gap-1.5 text-xs font-sans opacity-80 hover:opacity-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Shelf</span>
            </Button>

            <div className="h-4 w-px bg-current opacity-20 hidden sm:block" />

            <div className="min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider opacity-60 truncate">
                {book.title}
              </h2>
              <p className="text-sm font-serif font-medium truncate">{currentChapter.title}</p>
            </div>
          </div>

          {/* Right: Controls & Drawers */}
          <div className="flex items-center gap-1">
            {/* Audio Speech */}
            <Button
              id="btn-toggle-audio"
              variant="ghost"
              size="icon"
              onClick={() => setIsAudioBarOpen((prev) => !prev)}
              className={`h-8 w-8 ${
                isAudioBarOpen ? "text-amber-600 bg-amber-500/10" : "opacity-75 hover:opacity-100"
              }`}
              title="Listen to chapter"
            >
              <Headphones className="w-4 h-4" />
            </Button>

            {/* Bookmark Current Chapter */}
            <Button
              id="btn-bookmark-chapter"
              variant="ghost"
              size="icon"
              onClick={handleToggleBookmark}
              className={`h-8 w-8 ${
                isBookmarked ? "text-amber-600 fill-amber-600" : "opacity-75 hover:opacity-100"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>

            {/* Table of Contents */}
            <Button
              id="btn-open-toc"
              variant="ghost"
              size="icon"
              onClick={() => setIsTocOpen(true)}
              className="h-8 w-8 opacity-75 hover:opacity-100"
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
            </Button>

            {/* Bookmarks & Annotations Sheet */}
            <Button
              id="btn-open-notes"
              variant="ghost"
              size="icon"
              onClick={() => setIsNotesOpen(true)}
              className="h-8 w-8 opacity-75 hover:opacity-100 relative"
              title="Notes & Highlights"
            >
              <StickyNote className="w-4 h-4" />
              {highlights.length + notes.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600" />
              )}
            </Button>

            {/* Reading Appearance Settings */}
            <Button
              id="btn-open-settings"
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="h-8 w-8 opacity-75 hover:opacity-100"
              title="Typography & Theme"
            >
              <Sliders className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Floating Text Selection Toolbar */}
      {selectionRange && (
        <div
          id="selection-toolbar"
          style={{
            position: "fixed",
            left: `${Math.max(16, Math.min(window.innerWidth - 220, selectionRange.x - 100))}px`,
            top: `${Math.max(60, selectionRange.y - 45)}px`,
            zIndex: 50,
          }}
          className="bg-stone-900 text-stone-100 text-xs rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1.5 border border-stone-700 animate-in fade-in"
        >
          <button
            id="btn-selection-highlight"
            onClick={handleCreateHighlight}
            className="flex items-center gap-1 px-2 py-1 hover:bg-stone-800 rounded text-amber-300 font-medium"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlight</span>
          </button>
          <div className="h-3 w-px bg-stone-700" />
          <button
            id="btn-selection-note"
            onClick={() => setShowNoteInput(true)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-stone-800 rounded text-stone-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>
        </div>
      )}

      {/* Inline note creator modal if user tapped Note */}
      {showNoteInput && selectionRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-stone-50 text-stone-900 rounded-lg p-5 max-w-sm w-full border border-stone-200 shadow-2xl space-y-3">
            <h3 className="font-serif font-semibold text-sm">Add Annotation</h3>
            <p className="text-xs text-stone-500 italic line-clamp-2 border-l-2 border-amber-600 pl-2">
              "{selectionRange.text}"
            </p>
            <textarea
              id="input-note-body"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Your reflection or marginalia note..."
              className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-700 h-24 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNoteInput(false);
                  setSelectionRange(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateNote}
                className="bg-amber-800 hover:bg-amber-900 text-white"
              >
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Reflowable Reading Canvas */}
      <main
        ref={contentContainerRef}
        onMouseUp={handleMouseUp}
        style={{
          paddingLeft: `${preferences.margin}px`,
          paddingRight: `${preferences.margin}px`,
          fontSize: `${preferences.font_size}px`,
          lineHeight: preferences.line_height,
        }}
        className={`max-w-3xl mx-auto py-12 px-6 ${fontFamilyClass} select-text transition-all`}
      >
        {/* Chapter Title & Header */}
        <div className="mb-10 text-center pb-8 border-b border-current opacity-20">
          <span className="text-xs uppercase font-sans tracking-widest opacity-60">
            {book.title}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold mt-2 tracking-tight">
            {currentChapter.title}
          </h1>
          <span className="text-xs font-sans opacity-50 block mt-2">
            Chapter {currentChapterIdx + 1} of {chapters.length}
          </span>
        </div>

        {/* Chapter Prose */}
        <article className="space-y-6">
          {paragraphs.map((para, pIdx) => {
            // Check if this paragraph is part of the active spoken sentence
            const isSpoken =
              activeSpokenText &&
              para.toLowerCase().includes(activeSpokenText.slice(0, 30).toLowerCase());

            // Check if any highlights apply to this paragraph
            const matchedHighlight = highlights.find(
              (h) => h.chapter_idx === currentChapterIdx && para.includes(h.text_snippet),
            );

            return (
              <p
                key={pIdx}
                className={`leading-relaxed transition-colors duration-200 ${
                  isSpoken
                    ? "bg-amber-500/20 px-2 py-1 -mx-2 rounded"
                    : matchedHighlight
                      ? "bg-amber-400/25 px-1 rounded"
                      : ""
                }`}
              >
                {para}
              </p>
            );
          })}
        </article>

        {/* Chapter Navigation Footer */}
        <div className="mt-16 pt-8 border-t border-current opacity-30 flex items-center justify-between">
          <Button
            id="btn-prev-chapter"
            variant="ghost"
            disabled={currentChapterIdx <= 0}
            onClick={() => setCurrentChapterIdx((prev) => Math.max(0, prev - 1))}
            className="gap-1 font-sans text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Chapter
          </Button>

          <span className="text-xs font-sans opacity-70">
            {currentChapterIdx + 1} / {chapters.length}
          </span>

          <Button
            id="btn-next-chapter"
            variant="ghost"
            disabled={currentChapterIdx >= chapters.length - 1}
            onClick={() => setCurrentChapterIdx((prev) => Math.min(chapters.length - 1, prev + 1))}
            className="gap-1 font-sans text-xs"
          >
            Next Chapter
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Table of Contents Sheet */}
      <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
        <SheetContent
          side="left"
          className="bg-stone-50 text-stone-900 border-r border-stone-200 w-80 sm:w-96"
        >
          <SheetHeader className="border-b border-stone-200 pb-3">
            <SheetTitle className="font-serif text-lg text-stone-900">Table of Contents</SheetTitle>
            <p className="text-xs text-stone-500">{book.title}</p>
          </SheetHeader>

          <div className="py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
            {chapters.map((ch, idx) => {
              const isCurrent = idx === currentChapterIdx;
              return (
                <button
                  key={ch.idx}
                  type="button"
                  onClick={() => {
                    setCurrentChapterIdx(idx);
                    setIsTocOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded text-xs transition-colors flex items-center justify-between ${
                    isCurrent
                      ? "bg-amber-100 text-amber-900 font-semibold"
                      : "hover:bg-stone-200/60 text-stone-700"
                  }`}
                >
                  <span className="truncate pr-2">{ch.title}</span>
                  {isCurrent && <Check className="w-3.5 h-3.5 shrink-0 text-amber-800" />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Bookmarks, Notes & Highlights Sheet */}
      <Sheet open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <SheetContent
          side="right"
          className="bg-stone-50 text-stone-900 border-l border-stone-200 w-80 sm:w-96"
        >
          <SheetHeader className="border-b border-stone-200 pb-3">
            <SheetTitle className="font-serif text-lg text-stone-900">
              Marginalia & Bookmarks
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="highlights" className="pt-3">
            <TabsList className="grid grid-cols-3 bg-stone-200 text-xs">
              <TabsTrigger value="highlights">Highlights</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            </TabsList>

            {/* Highlights Tab */}
            <TabsContent value="highlights" className="space-y-3 pt-3">
              {highlights.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center italic">
                  No passages highlighted yet. Select text in the reader to highlight.
                </p>
              ) : (
                highlights.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-white border border-stone-200 rounded-lg space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Chapter {(h.chapter_idx ?? 0) + 1}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeHighlight(h.id);
                          setHighlights((prev) => prev.filter((item) => item.id !== h.id));
                        }}
                        className="text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p
                      onClick={() => {
                        setCurrentChapterIdx(h.chapter_idx);
                        setIsNotesOpen(false);
                      }}
                      className="text-xs italic text-stone-800 font-serif border-l-2 border-amber-500 pl-2 cursor-pointer hover:underline"
                    >
                      "{h.text_snippet}"
                    </p>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-3 pt-3">
              {notes.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center italic">
                  No notes taken yet. Highlight text and click "Note" to record reflections.
                </p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-white border border-stone-200 rounded-lg space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Chapter {(n.chapter_idx ?? 0) + 1}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeNote(n.id);
                          setNotes((prev) => prev.filter((item) => item.id !== n.id));
                        }}
                        className="text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-800 font-sans">{n.body}</p>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="space-y-3 pt-3">
              {bookmarks.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center italic">
                  No bookmarks placed. Tap the bookmark ribbon at the top right to save your place.
                </p>
              ) : (
                bookmarks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setCurrentChapterIdx(b.chapter_idx);
                      setIsNotesOpen(false);
                    }}
                    className="p-3 bg-white border border-stone-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-amber-700 shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-medium text-stone-900 font-serif">
                        {b.label || `Chapter ${b.chapter_idx + 1}`}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeBookmark(b.id);
                        setBookmarks((prev) => prev.filter((item) => item.id !== b.id));
                      }}
                      className="text-stone-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Reader Settings Modal */}
      <ReaderSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        preferences={preferences}
        onUpdatePreferences={onUpdatePreferences}
      />

      {/* Audio Player Bar */}
      {isAudioBarOpen && (
        <AudioPlayerBar
          currentText={currentChapter.content}
          chapterTitle={currentChapter.title}
          onActiveChunkChange={(_, text) => setActiveSpokenText(text)}
          onClose={() => setIsAudioBarOpen(false)}
        />
      )}
    </div>
  );
}

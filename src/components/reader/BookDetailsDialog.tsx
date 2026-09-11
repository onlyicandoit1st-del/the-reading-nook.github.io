import React, { useState, useEffect } from "react";
import type { Book, Chapter, Progress } from "@/lib/library";
import { getChapters, getProgress, deleteBook, updateBook } from "@/lib/library";
import { BookCover } from "@/components/books/BookCover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Headphones,
  Clock,
  Bookmark,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface BookDetailsDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartReading: (book: Book, chapterIdx?: number) => void;
  onStartListening: (book: Book, chapterIdx?: number) => void;
  onBookDeleted?: (book: Book) => void;
  onBookUpdated?: (book: Book) => void;
}

export function BookDetailsDialog({
  book,
  open,
  onOpenChange,
  onStartReading,
  onStartListening,
  onBookDeleted,
  onBookUpdated,
}: BookDetailsDialogProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Delete Confirmation state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!book || !open) {
      setIsEditing(false);
      setIsConfirmingDelete(false);
      return;
    }

    setEditTitle(book.title);
    setEditAuthor(book.author || "");
    setEditDescription(book.description || "");

    setIsLoading(true);
    Promise.all([getChapters(book.id), getProgress(book.id)])
      .then(([chaps, prog]) => {
        setChapters(chaps);
        setProgress(prog);
      })
      .finally(() => setIsLoading(false));
  }, [book, open]);

  if (!book) return null;

  const currentChapterIdx = progress?.chapter_idx ?? 0;
  const percent = progress ? Math.round(progress.percent * 100) : 0;
  const readMinutes = Math.max(1, Math.round((book.total_chars || 15000) / 1000));

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBook(book);
      toast.success(`"${book.title}" removed from your library.`);
      onOpenChange(false);
      if (onBookDeleted) onBookDeleted(book);
    } catch (err) {
      toast.error("Failed to remove book.");
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    const updated: Book = {
      ...book,
      title: editTitle.trim(),
      author: editAuthor.trim() || null,
      description: editDescription.trim() || null,
    };
    try {
      await updateBook(book.id, {
        title: updated.title,
        author: updated.author,
        description: updated.description,
      });
      toast.success("Book details updated");
      setIsEditing(false);
      if (onBookUpdated) onBookUpdated(updated);
    } catch {
      toast.error("Failed to update book");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#faf8f5] text-stone-900 border-stone-300 p-0 overflow-hidden shadow-xl rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{book.title}</DialogTitle>
        </DialogHeader>

        {/* Top Book Header with 3D Cover */}
        <div className="p-6 sm:p-7 border-b border-stone-200/80 bg-stone-100/60">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Book Cover */}
            <div className="shrink-0 transform hover:scale-102 transition-transform duration-200">
              <BookCover book={book} size="lg" />
            </div>

            {/* Book Metadata & Actions */}
            <div className="flex-1 flex flex-col justify-between text-center sm:text-left min-w-0 w-full space-y-3">
              {!isEditing ? (
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-sans font-semibold tracking-widest text-amber-800 uppercase">
                      {book.collection_id === "recently_added" ? "Recent Add" : "Bookshelf"}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[10px] font-sans text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />~{readMinutes} min read
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-medium text-stone-900 leading-snug mt-1 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="font-sans text-xs text-stone-600 font-medium tracking-wide mt-0.5">
                    {book.author || "Unknown Author"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Book Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-white text-xs h-8"
                  />
                  <Input
                    placeholder="Author Name"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="bg-white text-xs h-8"
                  />
                  <Textarea
                    placeholder="Synopsis / Description"
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="bg-white text-xs"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="bg-[#24201c] hover:bg-stone-800 text-white text-xs h-7 px-3"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="text-xs h-7 px-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Reading Progress status */}
              <div className="pt-2 space-y-1.5 max-w-xs mx-auto sm:mx-0 w-full">
                <div className="flex justify-between items-center text-xs text-stone-600">
                  <span className="font-sans">
                    {percent > 0
                      ? `Chapter ${currentChapterIdx + 1} of ${chapters.length || book.chapter_count}`
                      : "Not started"}
                  </span>
                  <span className="font-mono text-amber-800 font-medium">{percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-700 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Button
                  id="btn-details-read-now"
                  onClick={() => {
                    onOpenChange(false);
                    onStartReading(book, currentChapterIdx);
                  }}
                  className="bg-[#24201c] hover:bg-stone-800 text-[#faf8f5] text-xs h-9 px-4 rounded-lg font-sans gap-2 shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{percent > 0 ? "Continue Reading" : "Read Book"}</span>
                </Button>

                <Button
                  id="btn-details-listen-now"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onStartListening(book, currentChapterIdx);
                  }}
                  className="border-stone-300 hover:bg-stone-100 text-stone-800 text-xs h-9 px-3.5 rounded-lg font-sans gap-2"
                >
                  <Headphones className="w-4 h-4 text-amber-800" />
                  <span>Listen</span>
                </Button>

                {!isEditing && (
                  <Button
                    id="btn-details-edit"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-9 w-9 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
                    title="Edit details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}

                <Button
                  id="btn-details-bookmark-toggle"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsSaved(!isSaved);
                    toast.success(isSaved ? "Removed from saved" : "Saved to reading list");
                  }}
                  className="h-9 w-9 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
                  title="Bookmark"
                >
                  <Bookmark
                    className={`w-4 h-4 ${isSaved ? "fill-amber-700 text-amber-700" : ""}`}
                  />
                </Button>

                <Button
                  id="btn-details-delete"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="h-9 w-9 text-stone-400 hover:text-red-700 hover:bg-red-50"
                  title="Delete Book"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {isConfirmingDelete && (
          <div className="bg-red-50/80 border-b border-red-200 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Remove &quot;{book.title}&quot; from your library?</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsConfirmingDelete(false)}
                className="text-xs h-7 px-2.5 text-stone-600 hover:text-stone-900"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3 rounded-md"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}

        {/* Book Description & Chapters */}
        <div className="p-6 space-y-6 max-h-[38vh] overflow-y-auto">
          {book.description && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-sans font-semibold tracking-wider text-stone-500 uppercase">
                Synopsis
              </h4>
              <p className="font-serif text-xs sm:text-sm text-stone-700 leading-relaxed">
                {book.description}
              </p>
            </div>
          )}

          {/* Chapters Table */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-sans font-semibold tracking-wider text-stone-500 uppercase">
              Table of Contents ({chapters.length} {chapters.length === 1 ? "chapter" : "chapters"})
            </h4>
            <div className="divide-y divide-stone-200/70 border border-stone-200/70 rounded-lg overflow-hidden bg-white/50">
              {chapters.map((chap, idx) => (
                <button
                  key={chap.idx}
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onStartReading(book, idx);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-amber-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-stone-400 w-4">{idx + 1}</span>
                    <span className="font-serif text-stone-800 font-medium truncate group-hover:text-amber-900">
                      {chap.title}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

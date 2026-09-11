import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractPdf, renderFirstPageCover } from "@/lib/pdf";
import { saveLocalBook, type Book, type Chapter } from "@/lib/library";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";

interface UploadBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAdded: (book: Book) => void;
  existingBookIds?: string[];
}

export function UploadBookDialog({ open, onOpenChange, onBookAdded }: UploadBookDialogProps) {
  const [activeTab, setActiveTab] = useState<"file" | "write">("file");

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Write story state
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".txt") && !ext.endsWith(".md")) {
      toast.error("Please select a PDF, TXT, or Markdown document");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const parseTextFile = async (textFile: File): Promise<{ title: string; chapters: Chapter[] }> => {
    const text = await textFile.text();
    const fileNameWithoutExt = textFile.name.replace(/\.(txt|md)$/i, "");

    // Check for chapter delimiters like "Chapter 1", "CHAPTER I", "## Chapter"
    const chapterSplits = text.split(
      /(?=(?:^|\n)(?:#{1,3}\s+|Chapter\s+\d+|CHAPTER\s+[IVXLCDM\d]+))/i,
    );

    let chapters: Chapter[] = [];
    if (chapterSplits.length > 1) {
      chapters = chapterSplits
        .map((chunk, idx) => {
          const lines = chunk.trim().split("\n");
          const firstLine = lines[0].replace(/^#{1,3}\s+/, "").trim();
          const body = lines.slice(1).join("\n").trim() || firstLine;
          return {
            idx,
            title: firstLine.length > 60 ? `Chapter ${idx + 1}` : firstLine,
            content: body,
          };
        })
        .filter((c) => c.content.length > 0);
    }

    // Fallback: If no chapter markers, split into roughly 4,000 char sections or single chapter
    if (chapters.length === 0) {
      if (text.length > 6000) {
        const paragraphs = text.split(/\n\s*\n/);
        let currentChunk = "";
        let chapIdx = 0;
        for (const p of paragraphs) {
          currentChunk += p + "\n\n";
          if (currentChunk.length >= 4000) {
            chapters.push({
              idx: chapIdx,
              title: `Section ${chapIdx + 1}`,
              content: currentChunk.trim(),
            });
            chapIdx++;
            currentChunk = "";
          }
        }
        if (currentChunk.trim()) {
          chapters.push({
            idx: chapIdx,
            title: `Section ${chapIdx + 1}`,
            content: currentChunk.trim(),
          });
        }
      } else {
        chapters = [
          {
            idx: 0,
            title: "Full Text",
            content: text.trim(),
          },
        ];
      }
    }

    return {
      title: fileNameWithoutExt,
      chapters,
    };
  };

  const handleProcessAndSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);
    setStatusMessage("Opening file...");

    try {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      let chapters: Chapter[] = [];
      let bookTitle = file.name.replace(/\.(pdf|txt|md)$/i, "");
      let author = "Unknown Author";
      let coverBlob: Blob | null = null;

      if (isPdf) {
        setStatusMessage("Extracting reflowable chapters...");
        const extracted = await extractPdf(file, (percent) => {
          setProgress(Math.round(percent * 80));
        });
        chapters = extracted.chapters;
        if (extracted.title) bookTitle = extracted.title;
        if (extracted.author) author = extracted.author;

        setStatusMessage("Rendering book cover snapshot...");
        setProgress(88);
        coverBlob = await renderFirstPageCover(file);
      } else {
        setStatusMessage("Parsing text sections...");
        setProgress(50);
        const parsed = await parseTextFile(file);
        chapters = parsed.chapters;
        bookTitle = parsed.title;
      }

      setProgress(95);
      setStatusMessage("Adding to your personal shelf...");

      const newBookId = `book-${Date.now()}`;
      const totalChars = chapters.reduce((sum, c) => sum + c.content.length, 0);

      const newBook: Book = {
        id: newBookId,
        title: bookTitle,
        author: author,
        description: `Imported book with ${chapters.length} chapter${chapters.length === 1 ? "" : "s"} (${Math.round(totalChars / 5)} words).`,
        cover_path: null,
        file_path: null,
        collection_id: "recently_added",
        chapter_count: chapters.length || 1,
        total_chars: totalChars,
        last_read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      await saveLocalBook(newBook, chapters, coverBlob);
      setProgress(100);
      toast.success(`"${newBook.title}" added to your library!`);

      // Reset
      setFile(null);
      setIsProcessing(false);
      setProgress(0);
      onOpenChange(false);
      onBookAdded(newBook);
    } catch (err: unknown) {
      console.error("Book import error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to parse document.");
      setIsProcessing(false);
      setProgress(0);
      setStatusMessage("");
    }
  };

  const handleSaveManualBook = async () => {
    if (!manualTitle.trim()) {
      toast.error("Please enter a book title");
      return;
    }
    if (!manualContent.trim()) {
      toast.error("Please enter some book text or chapter content");
      return;
    }

    setIsSavingManual(true);
    try {
      const bookId = `custom-${Date.now()}`;
      // Split by double newline or chapter markers
      const rawChapters = manualContent.split(
        /(?=(?:^|\n)(?:Chapter\s+\d+|CHAPTER\s+[IVXLCDM\d]+))/i,
      );
      const chapters: Chapter[] =
        rawChapters.length > 1
          ? rawChapters.map((raw, idx) => ({
              idx,
              title: `Chapter ${idx + 1}`,
              content: raw.trim(),
            }))
          : [
              {
                idx: 0,
                title: "Chapter 1",
                content: manualContent.trim(),
              },
            ];

      const newBook: Book = {
        id: bookId,
        title: manualTitle.trim(),
        author: manualAuthor.trim() || "Independent Author",
        description: `Custom book created on ${new Date().toLocaleDateString()}`,
        cover_path: null,
        file_path: null,
        collection_id: "recently_added",
        chapter_count: chapters.length,
        total_chars: manualContent.length,
        last_read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      await saveLocalBook(newBook, chapters);
      toast.success(`"${newBook.title}" created and added to shelf!`);
      setManualTitle("");
      setManualAuthor("");
      setManualContent("");
      onOpenChange(false);
      onBookAdded(newBook);
    } catch (err) {
      toast.error("Failed to create book");
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#faf8f5] text-stone-900 border-stone-300 p-0 overflow-hidden shadow-xl rounded-xl">
        <DialogHeader className="p-6 pb-2 border-b border-stone-200/80 bg-white/70">
          <DialogTitle className="font-serif text-xl font-medium tracking-tight text-stone-900">
            Add to Library
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-stone-500">
            Import your own eBook documents (PDF, TXT, Markdown) or write custom prose.
          </DialogDescription>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "file" | "write")}
            className="pt-3 w-full"
          >
            <TabsList className="grid grid-cols-2 bg-stone-200/60 p-0.5 rounded-lg">
              <TabsTrigger
                value="file"
                className="text-xs data-[state=active]:bg-white data-[state=active]:text-stone-900 rounded-md py-1.5 flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </TabsTrigger>
              <TabsTrigger
                value="write"
                className="text-xs data-[state=active]:bg-white data-[state=active]:text-stone-900 rounded-md py-1.5 flex items-center justify-center gap-1.5"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Write / Paste Prose</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === "file" && (
            <div className="space-y-4">
              {!isProcessing ? (
                <>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                      isDragOver
                        ? "border-amber-800 bg-amber-50/50"
                        : file
                          ? "border-emerald-600/60 bg-emerald-50/30"
                          : "border-stone-300 hover:border-stone-400 bg-white/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />

                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        file ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {file ? (
                        <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                      ) : (
                        <Upload className="w-6 h-6 stroke-[1.75]" />
                      )}
                    </div>

                    {file ? (
                      <div className="space-y-1">
                        <p className="font-serif text-sm font-medium text-stone-900 truncate max-w-xs">
                          {file.name}
                        </p>
                        <p className="font-sans text-[11px] text-stone-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to import
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-serif text-sm text-stone-800 font-medium">
                          Click to select or drag & drop
                        </p>
                        <p className="font-sans text-[11px] text-stone-500">
                          Supports reflowable PDF, TXT, and Markdown files
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="text-xs text-stone-600 hover:text-stone-900"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProcessAndSave}
                      disabled={!file}
                      className="bg-[#24201c] hover:bg-stone-800 text-[#faf8f5] text-xs h-9 px-5 rounded-lg font-sans"
                    >
                      Import to Shelf
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8 space-y-4 text-center">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-800 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-serif text-sm text-stone-800 font-medium">{statusMessage}</p>
                    <p className="font-sans text-xs text-stone-400">
                      Processing chapters and reflowable typography...
                    </p>
                  </div>
                  <Progress value={progress} className="h-1.5 max-w-xs mx-auto bg-stone-200" />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WRITE / PASTE STORY */}
          {activeTab === "write" && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-serif font-medium text-stone-700">Book Title</label>
                <Input
                  placeholder="e.g. Letters from the North"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="bg-white border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-medium text-stone-700">
                  Author Name (Optional)
                </label>
                <Input
                  placeholder="e.g. E. M. Forester"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  className="bg-white border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-medium text-stone-700">
                  Content / Prose
                </label>
                <Textarea
                  placeholder="Paste your story, essays, or chapters here..."
                  rows={6}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="bg-white border-stone-300 text-xs font-serif leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-xs text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveManualBook}
                  disabled={isSavingManual || !manualTitle.trim() || !manualContent.trim()}
                  className="bg-[#24201c] hover:bg-stone-800 text-[#faf8f5] text-xs h-9 px-5 rounded-lg font-sans"
                >
                  {isSavingManual ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Create Book"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

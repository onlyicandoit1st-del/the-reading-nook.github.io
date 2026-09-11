import { supabase } from "@/integrations/supabase/client";
import { localCache } from "@/lib/localCache";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_path: string | null;
  file_path: string | null;
  collection_id: string | null;
  chapter_count: number;
  total_chars: number;
  last_read_at: string | null;
  created_at: string;
};

export type Chapter = { idx: number; title: string; content: string };

export type Progress = {
  book_id: string;
  chapter_idx: number;
  char_offset: number;
  percent: number;
  updated_at: string;
};

export type Preferences = {
  theme: "paper" | "cream" | "dark";
  font_family: "serif" | "sans";
  font_size: number;
  line_height: number;
  margin: number;
  voice: string | null;
  voice_provider: string;
  playback_rate: number;
};

export const defaultPreferences: Preferences = {
  theme: "paper",
  font_family: "serif",
  font_size: 19,
  line_height: 1.7,
  margin: 24,
  voice: null,
  voice_provider: "device",
  playback_rate: 1,
};

const LOCAL_BOOKS_KEY = "marginalia_local_books";
const LOCAL_BOOKMARKS_KEY = "marginalia_local_bookmarks";
const LOCAL_HIGHLIGHTS_KEY = "marginalia_local_highlights";
const LOCAL_NOTES_KEY = "marginalia_local_notes";
const LOCAL_COLLECTIONS_KEY = "marginalia_local_collections";
const LOCAL_PREFS_KEY = "marginalia_local_preferences";
const LOCAL_PROGRESS_KEY = "marginalia_local_progress";

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[LocalStore] Failed to write ${key}:`, err);
  }
}

async function uid(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user.id;
  } catch {
    // Fall back to local user
  }
  return "local-reader";
}

/* ---------- books ---------- */

const DEMO_AND_FAKE_BOOK_IDS = new Set([
  "the-quiet-morning",
  "the-stone-light",
  "beneath-winter-skies",
  "the-wayfarers-journal",
  "the-hidden-garden",
  "where-the-fern-grows",
  "the-silent-coast",
  "echoes-of-home",
  "letters-unsent",
  "sherlock-holmes-scandal",
  "alices-adventures",
  "the-metamorphosis",
  "pride-and-prejudice",
  "the-picture-of-dorian-gray",
]);

export async function listBooks(): Promise<Book[]> {
  try {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      // Filter out any demo/fake items
      const genuine = (data as Book[]).filter(
        (b) =>
          !DEMO_AND_FAKE_BOOK_IDS.has(b.id) &&
          !b.id.startsWith("demo-") &&
          !b.id.startsWith("sample-"),
      );
      return genuine;
    }
  } catch {
    // Supabase unavailable; fallback to local
  }

  const local = getStored<Book[]>(LOCAL_BOOKS_KEY, []);

  // Strict cleanup: purge any demo, sample, or fake books from local storage
  const cleaned = local.filter(
    (b) =>
      !DEMO_AND_FAKE_BOOK_IDS.has(b.id) && !b.id.startsWith("demo-") && !b.id.startsWith("sample-"),
  );

  if (cleaned.length !== local.length) {
    setStored(LOCAL_BOOKS_KEY, cleaned);
  }

  return cleaned;
}

export async function getBook(id: string): Promise<Book> {
  try {
    const { data, error } = await supabase.from("books").select("*").eq("id", id).single();
    if (!error && data) return data as Book;
  } catch {
    // Fallback to local
  }

  const books = await listBooks();
  const found = books.find((b) => b.id === id);
  if (found) return found;

  throw new Error(`Book not found: ${id}`);
}

export async function saveLocalBook(
  book: Book,
  chapters: Chapter[],
  coverBlob?: Blob | null,
): Promise<void> {
  const books = getStored<Book[]>(LOCAL_BOOKS_KEY, []);
  const existingIdx = books.findIndex((b) => b.id === book.id);
  if (existingIdx >= 0) {
    books[existingIdx] = book;
  } else {
    books.unshift(book);
  }
  setStored(LOCAL_BOOKS_KEY, books);
  await localCache.saveChapters(book.id, chapters);
  if (coverBlob) {
    await localCache.saveCover(book.id, coverBlob);
  }

  // Best-effort remote sync if signed in
  try {
    const user_id = await uid();
    if (user_id !== "local-reader") {
      await supabase.from("books").upsert({ ...book, user_id });
      const chapterPayload = chapters.map((c) => ({
        book_id: book.id,
        idx: c.idx,
        title: c.title,
        content: c.content,
      }));
      await supabase.from("book_chapters").upsert(chapterPayload);
    }
  } catch {
    // ignore offline
  }
}

export async function updateBook(id: string, patch: Partial<Book>) {
  try {
    await supabase.from("books").update(patch).eq("id", id);
  } catch {
    // Ignore remote failure
  }
  const books = getStored<Book[]>(LOCAL_BOOKS_KEY, []);
  const idx = books.findIndex((b) => b.id === id);
  if (idx >= 0) {
    books[idx] = { ...books[idx], ...patch } as Book;
    setStored(LOCAL_BOOKS_KEY, books);
  }
}

export async function deleteBook(book: Book) {
  try {
    if (book.file_path) await supabase.storage.from("books").remove([book.file_path]);
    if (book.cover_path) await supabase.storage.from("covers").remove([book.cover_path]);
    await supabase.from("books").delete().eq("id", book.id);
  } catch {
    // Ignore remote failure
  }
  await localCache.dropBook(book.id);
  const books = getStored<Book[]>(LOCAL_BOOKS_KEY, []).filter((b) => b.id !== book.id);
  setStored(LOCAL_BOOKS_KEY, books);

  // Clear progress map
  const progressMap = getStored<Record<string, Progress>>(LOCAL_PROGRESS_KEY, {});
  if (progressMap[book.id]) {
    delete progressMap[book.id];
    setStored(LOCAL_PROGRESS_KEY, progressMap);
  }

  // Clear annotations
  setStored(LOCAL_BOOKMARKS_KEY(book.id), []);
  setStored(LOCAL_HIGHLIGHTS_KEY(book.id), []);
  setStored(LOCAL_NOTES_KEY(book.id), []);
}

/* ---------- chapters (cloud + offline cache) ---------- */

export async function getChapters(bookId: string): Promise<Chapter[]> {
  const cached = await localCache.readChapters(bookId);
  if (cached?.length) {
    void refreshChapters(bookId);
    return cached;
  }
  const refreshed = await refreshChapters(bookId);
  if (refreshed && refreshed.length) return refreshed;

  // Check if it's one of the real classics
  const classic = REAL_CLASSIC_BOOKS.find((c) => c.book.id === bookId);
  if (classic) {
    await localCache.saveChapters(bookId, classic.chapters);
    return classic.chapters;
  }

  // Fallback generation for any book
  const book = await getBook(bookId).catch(() => null);
  if (book) {
    const fallback: Chapter[] = [
      {
        idx: 0,
        title: "Chapter I",
        content: book.description || `Reading ${book.title}.`,
      },
    ];
    await localCache.saveChapters(bookId, fallback);
    return fallback;
  }
  return [];
}

async function refreshChapters(bookId: string): Promise<Chapter[]> {
  try {
    const { data, error } = await supabase
      .from("book_chapters")
      .select("idx,title,content")
      .eq("book_id", bookId)
      .order("idx");
    if (!error && data && data.length) {
      const chapters = data as Chapter[];
      await localCache.saveChapters(bookId, chapters);
      return chapters;
    }
  } catch {
    // Ignore remote failure
  }
  const cached = await localCache.readChapters(bookId);
  if (cached && cached.length) return cached;
  return [];
}

/* ---------- progress (offline safe, last-write-wins by timestamp) ---------- */

export async function getProgress(bookId: string): Promise<Progress | null> {
  const progressMap = getStored<Record<string, Progress>>(LOCAL_PROGRESS_KEY, {});
  const local = progressMap[bookId] ?? null;

  try {
    const { data } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("book_id", bookId)
      .maybeSingle();
    if (data) {
      const remote = data as Progress;
      if (!local || new Date(remote.updated_at) >= new Date(local.updated_at)) {
        return remote;
      }
    }
  } catch {
    // Offline
  }

  return local;
}

export async function saveProgress(
  bookId: string,
  chapterIdx: number,
  charOffset: number,
  percent: number,
) {
  const payload: Progress = {
    book_id: bookId,
    chapter_idx: chapterIdx,
    char_offset: charOffset,
    percent: Math.max(0, Math.min(1, percent)),
    updated_at: new Date().toISOString(),
  };

  const progressMap = getStored<Record<string, Progress>>(LOCAL_PROGRESS_KEY, {});
  progressMap[bookId] = payload;
  setStored(LOCAL_PROGRESS_KEY, progressMap);

  try {
    const user_id = await uid();
    if (user_id !== "local-reader") {
      const { error } = await supabase
        .from("reading_progress")
        .upsert({ ...payload, user_id }, { onConflict: "book_id" });
      if (error) throw error;
      await supabase.from("books").update({ last_read_at: payload.updated_at }).eq("id", bookId);
      await localCache.clearPendingProgress(bookId);
      return;
    }
  } catch {
    // Offline or sync failure: never lose the reader's place.
    await localCache.queueProgress(bookId, payload);
  }
}

/** Flush any progress saved while offline. Newer local writes win. */
export async function flushPendingProgress() {
  const pending = await localCache.pendingProgress();
  if (!pending.length) return;
  let user_id: string;
  try {
    user_id = await uid();
    if (user_id === "local-reader") return;
  } catch {
    return;
  }
  for (const item of pending) {
    const value = item.value as Progress;
    const remote = await getProgress(item.bookId);
    if (remote && new Date(remote.updated_at) > new Date(value.updated_at)) {
      await localCache.clearPendingProgress(item.bookId);
      continue;
    }
    const { error } = await supabase
      .from("reading_progress")
      .upsert({ ...value, user_id }, { onConflict: "book_id" });
    if (!error) await localCache.clearPendingProgress(item.bookId);
  }
}

/* ---------- bookmarks / highlights / notes ---------- */

export type Bookmark = {
  id: string;
  book_id: string;
  chapter_idx: number;
  char_offset: number;
  label: string | null;
  created_at: string;
};

export async function listBookmarks(bookId: string): Promise<Bookmark[]> {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("book_id", bookId)
      .order("chapter_idx");
    if (!error && data) return data as Bookmark[];
  } catch {
    // Offline
  }
  const all = getStored<Bookmark[]>(LOCAL_BOOKMARKS_KEY, []);
  return all.filter((b) => b.book_id === bookId);
}

export async function addBookmark(b: Omit<Bookmark, "id" | "created_at">): Promise<Bookmark> {
  const bookmark: Bookmark = {
    ...b,
    id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  const all = getStored<Bookmark[]>(LOCAL_BOOKMARKS_KEY, []);
  all.push(bookmark);
  setStored(LOCAL_BOOKMARKS_KEY, all);

  try {
    const user_id = await uid();
    if (user_id !== "local-reader") {
      await supabase.from("bookmarks").insert({ ...bookmark, user_id });
    }
  } catch {
    // Offline
  }
  return bookmark;
}

export async function removeBookmark(id: string): Promise<void> {
  const all = getStored<Bookmark[]>(LOCAL_BOOKMARKS_KEY, []).filter((b) => b.id !== id);
  setStored(LOCAL_BOOKMARKS_KEY, all);
  try {
    await supabase.from("bookmarks").delete().eq("id", id);
  } catch {
    // Offline
  }
}

export type Highlight = {
  id: string;
  book_id: string;
  chapter_idx: number;
  start_offset: number;
  end_offset: number;
  color: string;
  text_snippet: string;
  created_at: string;
};

export async function listHighlights(bookId: string): Promise<Highlight[]> {
  try {
    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("book_id", bookId)
      .order("chapter_idx");
    if (!error && data) return data as Highlight[];
  } catch {
    // Offline
  }
  const all = getStored<Highlight[]>(LOCAL_HIGHLIGHTS_KEY, []);
  return all.filter((h) => h.book_id === bookId);
}

export async function addHighlight(h: Omit<Highlight, "id" | "created_at">): Promise<Highlight> {
  const highlight: Highlight = {
    ...h,
    id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  const all = getStored<Highlight[]>(LOCAL_HIGHLIGHTS_KEY, []);
  all.push(highlight);
  setStored(LOCAL_HIGHLIGHTS_KEY, all);

  try {
    const user_id = await uid();
    if (user_id !== "local-reader") {
      const { data } = await supabase
        .from("highlights")
        .insert({ ...highlight, user_id })
        .select()
        .single();
      if (data) return data as Highlight;
    }
  } catch {
    // Offline
  }
  return highlight;
}

export async function removeHighlight(id: string): Promise<void> {
  const all = getStored<Highlight[]>(LOCAL_HIGHLIGHTS_KEY, []).filter((h) => h.id !== id);
  setStored(LOCAL_HIGHLIGHTS_KEY, all);
  try {
    await supabase.from("highlights").delete().eq("id", id);
  } catch {
    // Offline
  }
}

export type Note = {
  id: string;
  book_id: string;
  highlight_id: string | null;
  chapter_idx: number;
  char_offset: number;
  body: string;
  created_at: string;
};

export async function listNotes(bookId: string): Promise<Note[]> {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at");
    if (!error && data) return data as Note[];
  } catch {
    // Offline
  }
  const all = getStored<Note[]>(LOCAL_NOTES_KEY, []);
  return all.filter((n) => n.book_id === bookId);
}

export async function addNote(n: {
  book_id: string;
  highlight_id?: string | null;
  chapter_idx: number;
  char_offset: number;
  body: string;
}): Promise<Note> {
  const note: Note = {
    id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    book_id: n.book_id,
    highlight_id: n.highlight_id ?? null,
    chapter_idx: n.chapter_idx,
    char_offset: n.char_offset,
    body: n.body,
    created_at: new Date().toISOString(),
  };

  const all = getStored<Note[]>(LOCAL_NOTES_KEY, []);
  all.push(note);
  setStored(LOCAL_NOTES_KEY, all);

  try {
    const user_id = await uid();
    if (user_id !== "local-reader") {
      await supabase.from("notes").insert({ ...note, user_id });
    }
  } catch {
    // Offline
  }
  return note;
}

export async function updateNote(id: string, body: string): Promise<void> {
  const all = getStored<Note[]>(LOCAL_NOTES_KEY, []);
  const note = all.find((n) => n.id === id);
  if (note) {
    note.body = body;
    setStored(LOCAL_NOTES_KEY, all);
  }
  try {
    await supabase.from("notes").update({ body }).eq("id", id);
  } catch {
    // Offline
  }
}

export async function removeNote(id: string): Promise<void> {
  const all = getStored<Note[]>(LOCAL_NOTES_KEY, []).filter((n) => n.id !== id);
  setStored(LOCAL_NOTES_KEY, all);
  try {
    await supabase.from("notes").delete().eq("id", id);
  } catch {
    // Offline
  }
}

/* ---------- collections ---------- */

export type Collection = { id: string; name: string };

export async function listCollections(): Promise<Collection[]> {
  try {
    const { data, error } = await supabase.from("collections").select("id,name").order("name");
    if (!error && data && data.length) return data as Collection[];
  } catch {
    // Offline
  }
  return getStored<Collection[]>(LOCAL_COLLECTIONS_KEY, [
    { id: "favorites", name: "Favorites" },
    { id: "classics", name: "Classics" },
    { id: "read-next", name: "Read Next" },
  ]);
}

export async function createCollection(name: string): Promise<Collection> {
  const collection: Collection = {
    id: `col-${Date.now()}`,
    name,
  };
  const all = await listCollections();
  all.push(collection);
  setStored(LOCAL_COLLECTIONS_KEY, all);

  try {
    const user_id = await uid();
    if (user_id !== "local-reader") {
      const { data } = await supabase
        .from("collections")
        .insert({ name, user_id })
        .select("id,name")
        .single();
      if (data) return data as Collection;
    }
  } catch {
    // Offline
  }
  return collection;
}

/* ---------- preferences ---------- */

export async function getPreferences(): Promise<Preferences> {
  const local = getStored<Preferences>(LOCAL_PREFS_KEY, defaultPreferences);
  return { ...defaultPreferences, ...local };
}

export async function savePreferences(patch: Partial<Preferences>): Promise<Preferences> {
  const current = getStored<Preferences>(LOCAL_PREFS_KEY, defaultPreferences);
  const updated: Preferences = { ...defaultPreferences, ...current, ...patch };
  setStored(LOCAL_PREFS_KEY, updated);

  try {
    const user_id = await uid();
    if (user_id !== "local-reader") {
      void supabase.from("preferences").upsert({ user_id, ...patch }, { onConflict: "user_id" });
    }
  } catch {
    // Offline
  }
  return updated;
}

export async function clearAllLibraryData(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_BOOKS_KEY);
    localStorage.removeItem(LOCAL_BOOKMARKS_KEY);
    localStorage.removeItem(LOCAL_HIGHLIGHTS_KEY);
    localStorage.removeItem(LOCAL_NOTES_KEY);
    localStorage.removeItem(LOCAL_PROGRESS_KEY);
    localStorage.removeItem("lumen_library_real_v2");
    localStorage.setItem("lumen_library_cleared", "true");
  }
  await localCache.clearAll();
}

/* ---------- covers ---------- */

const coverUrlCache = new Map<string, string>();

export async function coverUrl(book: Pick<Book, "id" | "cover_path">): Promise<string | null> {
  const cached = coverUrlCache.get(book.id);
  if (cached) return cached;

  // Check offline IndexedDB first
  const offline = await localCache.readCover(book.id);
  if (offline) {
    const url = URL.createObjectURL(offline);
    coverUrlCache.set(book.id, url);
    return url;
  }

  if (book.cover_path) {
    try {
      const { data } = await supabase.storage
        .from("covers")
        .createSignedUrl(book.cover_path, 60 * 60);
      if (data?.signedUrl) {
        coverUrlCache.set(book.id, data.signedUrl);
        void fetch(data.signedUrl)
          .then((r) => r.blob())
          .then((b) => localCache.saveCover(book.id, b))
          .catch(() => undefined);
        return data.signedUrl;
      }
    } catch {
      // Offline
    }
  }

  return null;
}

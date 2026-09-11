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

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/* ---------- books ---------- */

export async function listBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Book[];
}

export async function getBook(id: string): Promise<Book> {
  const { data, error } = await supabase.from("books").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Book;
}

export async function updateBook(id: string, patch: Partial<Book>) {
  const { error } = await supabase.from("books").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBook(book: Book) {
  if (book.file_path) await supabase.storage.from("books").remove([book.file_path]);
  if (book.cover_path) await supabase.storage.from("covers").remove([book.cover_path]);
  const { error } = await supabase.from("books").delete().eq("id", book.id);
  if (error) throw error;
  await localCache.dropBook(book.id);
}

/* ---------- chapters (cloud + offline cache) ---------- */

export async function getChapters(bookId: string): Promise<Chapter[]> {
  const cached = await localCache.readChapters(bookId);
  if (cached?.length) {
    void refreshChapters(bookId);
    return cached;
  }
  return refreshChapters(bookId);
}

async function refreshChapters(bookId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from("book_chapters")
    .select("idx,title,content")
    .eq("book_id", bookId)
    .order("idx");
  if (error) {
    const cached = await localCache.readChapters(bookId);
    if (cached) return cached;
    throw error;
  }
  const chapters = (data ?? []) as Chapter[];
  if (chapters.length) await localCache.saveChapters(bookId, chapters);
  return chapters;
}

/* ---------- progress (offline safe, last-write-wins by timestamp) ---------- */

export async function getProgress(bookId: string): Promise<Progress | null> {
  const { data } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("book_id", bookId)
    .maybeSingle();
  return (data as Progress) ?? null;
}

export async function saveProgress(
  bookId: string,
  chapterIdx: number,
  charOffset: number,
  percent: number,
) {
  const payload = {
    book_id: bookId,
    chapter_idx: chapterIdx,
    char_offset: charOffset,
    percent: Math.max(0, Math.min(1, percent)),
    updated_at: new Date().toISOString(),
  };
  try {
    const user_id = await uid();
    const { error } = await supabase
      .from("reading_progress")
      .upsert({ ...payload, user_id }, { onConflict: "book_id" });
    if (error) throw error;
    await supabase.from("books").update({ last_read_at: payload.updated_at }).eq("id", bookId);
    await localCache.clearPendingProgress(bookId);
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

export type Highlight = {
  id: string;
  book_id: string;
  chapter_idx: number;
  start_offset: number;
  end_offset: number;
  text: string;
  created_at: string;
};

export type Note = {
  id: string;
  book_id: string;
  highlight_id: string | null;
  chapter_idx: number;
  char_offset: number;
  body: string;
  created_at: string;
  updated_at: string;
};

export async function listBookmarks(bookId: string) {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("book_id", bookId)
    .order("chapter_idx");
  if (error) throw error;
  return (data ?? []) as Bookmark[];
}

export async function addBookmark(b: Omit<Bookmark, "id" | "created_at">) {
  const user_id = await uid();
  const { error } = await supabase.from("bookmarks").insert({ ...b, user_id });
  if (error) throw error;
}

export async function removeBookmark(id: string) {
  const { error } = await supabase.from("bookmarks").delete().eq("id", id);
  if (error) throw error;
}

export async function listHighlights(bookId: string) {
  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .eq("book_id", bookId)
    .order("chapter_idx");
  if (error) throw error;
  return (data ?? []) as Highlight[];
}

export async function addHighlight(h: Omit<Highlight, "id" | "created_at">) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("highlights")
    .insert({ ...h, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as Highlight;
}

export async function removeHighlight(id: string) {
  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (error) throw error;
}

export async function listNotes(bookId: string) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function addNote(n: {
  book_id: string;
  highlight_id?: string | null;
  chapter_idx: number;
  char_offset: number;
  body: string;
}) {
  const user_id = await uid();
  const { error } = await supabase.from("notes").insert({ ...n, user_id });
  if (error) throw error;
}

export async function updateNote(id: string, body: string) {
  const { error } = await supabase.from("notes").update({ body }).eq("id", id);
  if (error) throw error;
}

export async function removeNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- collections ---------- */

export type Collection = { id: string; name: string };

export async function listCollections(): Promise<Collection[]> {
  const { data, error } = await supabase.from("collections").select("id,name").order("name");
  if (error) throw error;
  return (data ?? []) as Collection[];
}

export async function createCollection(name: string): Promise<Collection> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("collections")
    .insert({ name, user_id })
    .select("id,name")
    .single();
  if (error) throw error;
  return data as Collection;
}

/* ---------- preferences ---------- */

export async function getPreferences(): Promise<Preferences> {
  const { data } = await supabase.from("preferences").select("*").maybeSingle();
  if (!data) return defaultPreferences;
  return { ...defaultPreferences, ...(data as Partial<Preferences>) };
}

export async function savePreferences(patch: Partial<Preferences>) {
  const user_id = await uid();
  const { error } = await supabase
    .from("preferences")
    .upsert({ user_id, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}

/* ---------- covers ---------- */

const coverUrlCache = new Map<string, string>();

export async function coverUrl(book: Pick<Book, "id" | "cover_path">): Promise<string | null> {
  if (!book.cover_path) return null;
  const cached = coverUrlCache.get(book.id);
  if (cached) return cached;
  const { data } = await supabase.storage.from("covers").createSignedUrl(book.cover_path, 60 * 60);
  if (data?.signedUrl) {
    coverUrlCache.set(book.id, data.signedUrl);
    void fetch(data.signedUrl)
      .then((r) => r.blob())
      .then((b) => localCache.saveCover(book.id, b))
      .catch(() => undefined);
    return data.signedUrl;
  }
  const offline = await localCache.readCover(book.id);
  return offline ? URL.createObjectURL(offline) : null;
}

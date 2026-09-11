/**
 * Offline-first local cache (IndexedDB).
 * Chapters and covers are cached on the device so a book that has been opened
 * once can be read again with no network. Reading progress written while
 * offline is queued here and flushed to the cloud on the next successful sync.
 */

const DB_NAME = "marginalia";
const DB_VERSION = 1;

type Stores = "chapters" | "covers" | "pendingProgress";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("no-indexeddb"));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("chapters")) db.createObjectStore("chapters");
        if (!db.objectStoreNames.contains("covers")) db.createObjectStore("covers");
        if (!db.objectStoreNames.contains("pendingProgress"))
          db.createObjectStore("pendingProgress");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function put(store: Stores, key: string, value: unknown) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve(null);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* cache is best-effort */
  }
}

async function get<T>(store: Stores, key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function del(store: Stores, key: string) {
  try {
    const db = await openDb();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
  } catch {
    /* ignore */
  }
}

async function keys(store: Stores): Promise<string[]> {
  try {
    const db = await openDb();
    return await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).getAllKeys();
      req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export type CachedChapter = { idx: number; title: string; content: string };

export const localCache = {
  saveChapters: (bookId: string, chapters: CachedChapter[]) =>
    put("chapters", bookId, { chapters, cachedAt: Date.now() }),
  readChapters: async (bookId: string): Promise<CachedChapter[] | null> => {
    const row = await get<{ chapters: CachedChapter[] }>("chapters", bookId);
    return row?.chapters ?? null;
  },
  dropBook: async (bookId: string) => {
    await del("chapters", bookId);
    await del("covers", bookId);
  },
  cachedBookIds: () => keys("chapters"),
  saveCover: (bookId: string, blob: Blob) => put("covers", bookId, blob),
  readCover: (bookId: string) => get<Blob>("covers", bookId),
  queueProgress: (bookId: string, value: unknown) => put("pendingProgress", bookId, value),
  pendingProgress: async () => {
    const ids = await keys("pendingProgress");
    const out: Array<{ bookId: string; value: unknown }> = [];
    for (const id of ids) {
      const value = await get("pendingProgress", id);
      if (value) out.push({ bookId: id, value });
    }
    return out;
  },
  clearPendingProgress: (bookId: string) => del("pendingProgress", bookId),
};

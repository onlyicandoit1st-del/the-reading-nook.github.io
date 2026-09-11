/**
 * Client-side PDF text extraction.
 * Produces a reflowable chapter model: { title, content } where content is
 * plain text with blank-line separated paragraphs.
 */

export type ExtractedChapter = { title: string; content: string };

export type ExtractedBook = {
  title: string | null;
  author: string | null;
  chapters: ExtractedChapter[];
  pageCount: number;
};

type Line = { text: string; y: number; height: number; x: number; width: number };

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  return pdfjs;
}

function linesFromItems(items: Array<Record<string, unknown>>): Line[] {
  const lines: Line[] = [];
  for (const item of items) {
    const str = String(item["str"] ?? "");
    if (!str.trim()) continue;
    const t = item["transform"] as number[] | undefined;
    if (!t) continue;
    const y = Math.round(t[5] ?? 0);
    const x = t[4] ?? 0;
    const height = Math.abs(t[3] ?? 10);
    const width = Number(item["width"] ?? 0);
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - y) <= 2) {
      last.text += (item["hasEOL"] ? " " : "") + str;
      last.width = Math.max(last.width, x + width - last.x);
      last.height = Math.max(last.height, height);
    } else {
      lines.push({ text: str, y, height, x, width });
    }
  }
  return lines;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

/** Join lines into paragraphs, repairing hyphenation and hard wraps. */
function paragraphsFromLines(lines: Line[], maxWidth: number): string[] {
  const paras: string[] = [];
  let current = "";
  for (const line of lines) {
    const text = line.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (!current) {
      current = text;
    } else if (current.endsWith("-")) {
      current = current.slice(0, -1) + text;
    } else {
      current += " " + text;
    }
    const short = line.width > 0 && line.width < maxWidth * 0.86;
    const sentenceEnd = /[.!?"'”’)]$/.test(text);
    if (short && sentenceEnd) {
      paras.push(current);
      current = "";
    }
  }
  if (current) paras.push(current);
  return paras;
}

function looksLikeRunningHead(text: string, pageNumber: number): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^\d{1,4}$/.test(t)) return true;
  if (t === String(pageNumber)) return true;
  if (/^page\s+\d+/i.test(t)) return true;
  return false;
}

function cleanTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 120);
}

export async function extractPdf(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<ExtractedBook> {
  const pdfjs = await loadPdfjs();
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;

  let metaTitle: string | null = null;
  let metaAuthor: string | null = null;
  try {
    const meta = await doc.getMetadata();
    const info = meta.info as Record<string, unknown> | undefined;
    const t = info?.["Title"];
    const a = info?.["Author"];
    if (typeof t === "string" && t.trim()) metaTitle = cleanTitle(t);
    if (typeof a === "string" && a.trim()) metaAuthor = cleanTitle(a);
  } catch {
    /* metadata is optional */
  }

  const pageCount = doc.numPages;
  const pageParas: string[][] = [];
  const pageHeadings: Array<{ title: string; index: number }> = [];

  const heights: number[] = [];
  const pageLines: Line[][] = [];
  const pageWidths: number[] = [];

  for (let p = 1; p <= pageCount; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lines = linesFromItems(content.items as Array<Record<string, unknown>>).filter(
      (l) => !looksLikeRunningHead(l.text, p),
    );
    pageLines.push(lines);
    pageWidths.push(page.view[2] ?? 600);
    for (const l of lines) heights.push(l.height);
    onProgress?.((p / pageCount) * 0.9);
  }

  const bodyHeight = median(heights) || 10;

  for (let i = 0; i < pageLines.length; i++) {
    const lines = pageLines[i] ?? [];
    const maxWidth = median(lines.map((l) => l.width).filter(Boolean)) || (pageWidths[i] ?? 600);
    const heading = lines.find(
      (l) =>
        l.height >= bodyHeight * 1.3 &&
        l.text.trim().length > 1 &&
        l.text.trim().length < 90 &&
        !/[.]$/.test(l.text.trim()),
    );
    const body = heading ? lines.filter((l) => l !== heading) : lines;
    const paras = paragraphsFromLines(body, maxWidth);
    pageParas.push(paras);
    if (heading) pageHeadings.push({ title: cleanTitle(heading.text), index: i });
  }

  // Outline (real table of contents) wins when the PDF provides one.
  const starts: Array<{ title: string; page: number }> = [];
  try {
    const outline = await doc.getOutline();
    if (outline && outline.length > 1) {
      for (const item of outline) {
        try {
          const dest =
            typeof item.dest === "string" ? await doc.getDestination(item.dest) : item.dest;
          if (!dest || !dest[0]) continue;
          const pageIndex = await doc.getPageIndex(dest[0]);
          starts.push({ title: cleanTitle(item.title), page: pageIndex });
        } catch {
          /* skip unresolvable entries */
        }
      }
    }
  } catch {
    /* outline is optional */
  }

  let boundaries = starts;
  if (boundaries.length < 2 && pageHeadings.length >= 2 && pageHeadings.length <= pageCount / 2) {
    boundaries = pageHeadings.map((h) => ({ title: h.title, page: h.index }));
  }

  const chapters: ExtractedChapter[] = [];
  if (boundaries.length >= 2) {
    boundaries.sort((a, b) => a.page - b.page);
    if ((boundaries[0]?.page ?? 0) > 0) boundaries.unshift({ title: "Beginning", page: 0 });
    for (let i = 0; i < boundaries.length; i++) {
      const from = boundaries[i]!.page;
      const to = i + 1 < boundaries.length ? boundaries[i + 1]!.page : pageCount;
      const text = pageParas
        .slice(from, to)
        .flat()
        .join("\n\n")
        .trim();
      if (text.length < 40) continue;
      chapters.push({ title: boundaries[i]!.title || `Chapter ${chapters.length + 1}`, content: text });
    }
  }

  if (!chapters.length) {
    const perChunk = Math.max(6, Math.ceil(pageCount / 20));
    for (let i = 0; i < pageCount; i += perChunk) {
      const text = pageParas
        .slice(i, i + perChunk)
        .flat()
        .join("\n\n")
        .trim();
      if (!text) continue;
      chapters.push({ title: `Part ${chapters.length + 1}`, content: text });
    }
  }

  onProgress?.(1);

  const guessedTitle =
    metaTitle ||
    cleanTitle(
      (pageLines[0] ?? [])
        .slice()
        .sort((a, b) => b.height - a.height)[0]?.text ?? "",
    ) ||
    file.name.replace(/\.pdf$/i, "");

  return {
    title: guessedTitle || null,
    author: metaAuthor,
    chapters,
    pageCount,
  };
}

export async function renderFirstPageCover(file: File): Promise<Blob | null> {
  try {
    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = 900 / viewport.height;
    const scaled = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(scaled.width);
    canvas.height = Math.round(scaled.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    await page.render({ canvas, canvasContext: ctx, viewport: scaled }).promise;
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85));
  } catch {
    return null;
  }
}

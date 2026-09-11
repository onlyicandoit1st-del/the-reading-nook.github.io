import React from "react";
import type { Book } from "@/lib/library";

interface BookCoverProps {
  book: Book;
  size?: "sm" | "md" | "lg" | "featured";
  className?: string;
  showSpine?: boolean;
}

// Deterministic aesthetic cloth palettes for real books
const CLOTH_PALETTES = [
  {
    bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    accent: "#e2e8f0",
    gold: "#d4af37",
    border: "rgba(212, 175, 55, 0.4)",
  }, // Oxford Navy
  {
    bg: "linear-gradient(135deg, #451a1a 0%, #2b0d0d 100%)",
    accent: "#fecdd3",
    gold: "#fbbf24",
    border: "rgba(251, 191, 36, 0.4)",
  }, // Burgundy Cloth
  {
    bg: "linear-gradient(135deg, #1c352d 0%, #0d1e18 100%)",
    accent: "#d1fae5",
    gold: "#c68a4c",
    border: "rgba(198, 138, 76, 0.4)",
  }, // Forest Hunter
  {
    bg: "linear-gradient(135deg, #38271d 0%, #20150e 100%)",
    accent: "#fed7aa",
    gold: "#d97706",
    border: "rgba(217, 119, 6, 0.4)",
  }, // Burnt Terracotta
  {
    bg: "linear-gradient(135deg, #2d2438 0%, #171120 100%)",
    accent: "#e9d5ff",
    gold: "#e0a96d",
    border: "rgba(224, 169, 109, 0.4)",
  }, // Imperial Plum
  {
    bg: "linear-gradient(135deg, #292d32 0%, #181a1d 100%)",
    accent: "#f3f4f6",
    gold: "#cbd5e1",
    border: "rgba(203, 213, 225, 0.35)",
  }, // Charcoal Slate
];

function getPalette(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % CLOTH_PALETTES.length;
  return CLOTH_PALETTES[idx];
}

export function BookCover({ book, size = "md", className = "", showSpine = true }: BookCoverProps) {
  const sizeClasses = {
    sm: "w-16 aspect-[1/1.5] text-[8px]",
    md: "w-full aspect-[1/1.5] text-[10px]",
    lg: "w-36 aspect-[1/1.5] text-xs",
    featured: "w-44 sm:w-52 md:w-56 aspect-[1/1.48] text-xs",
  }[size];

  // Render actual image cover if available (e.g. from PDF first page or image)
  if (book.cover_path && !book.cover_path.startsWith("preset-")) {
    return (
      <div
        className={`relative rounded-sm overflow-hidden bg-stone-200 ${sizeClasses} ${className}`}
        style={{
          boxShadow:
            "-4px 7px 18px -2px rgba(0,0,0,0.25), 0 10px 24px -4px rgba(0,0,0,0.18), inset 2px 0 3px rgba(255,255,255,0.2)",
        }}
      >
        <img
          src={book.cover_path}
          alt={book.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {showSpine && (
          <>
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 left-[3px] w-[1px] bg-white/20 pointer-events-none z-10" />
          </>
        )}
      </div>
    );
  }

  // Generative Publisher Hardcover for real uploaded or written books
  const palette = getPalette(book.title);

  return (
    <div
      className={`relative rounded-sm overflow-hidden flex flex-col justify-between p-3.5 sm:p-5 select-none ${sizeClasses} ${className}`}
      style={{
        background: palette.bg,
        boxShadow:
          "-4px 7px 18px -2px rgba(0,0,0,0.3), 0 10px 24px -4px rgba(0,0,0,0.2), inset 3px 0 4px rgba(255,255,255,0.18)",
      }}
    >
      {showSpine && (
        <>
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 left-[3px] w-[1px] bg-white/20 pointer-events-none z-10" />
        </>
      )}

      {/* Embossed border frame */}
      <div
        className="absolute inset-2 rounded-xs pointer-events-none"
        style={{ border: `1px solid ${palette.border}` }}
      />

      {/* Book Title */}
      <div className="relative z-10 text-center space-y-1 pt-1.5">
        <p
          className="font-serif tracking-[0.22em] text-[8px] uppercase opacity-80 truncate"
          style={{ color: palette.gold }}
        >
          {book.collection_id === "recently_added" ? "Recent" : "Edition"}
        </p>
        <h3
          className="font-serif tracking-wider font-semibold text-xs sm:text-sm leading-snug line-clamp-3"
          style={{ color: palette.accent }}
        >
          {book.title}
        </h3>
      </div>

      {/* Decorative center mark */}
      <div
        className="relative z-10 my-auto flex justify-center py-2 opacity-75"
        style={{ color: palette.gold }}
      >
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      </div>

      {/* Author */}
      <div className="relative z-10 text-center pb-1">
        <p
          className="font-serif tracking-[0.2em] text-[8px] uppercase truncate opacity-85"
          style={{ color: palette.accent }}
        >
          {book.author || "Personal Library"}
        </p>
      </div>
    </div>
  );
}

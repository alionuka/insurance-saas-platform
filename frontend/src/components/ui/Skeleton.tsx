"use client";

/**
 * Skeleton placeholder — shimmer-animated grey block that occupies the
 * footprint of content that's still loading. Used in dashboards, tables,
 * and detail pages to avoid layout shift when async data arrives.
 *
 * Composed primitives let callers shape it precisely:
 *   <Skeleton className="h-4 w-32" />          // single line
 *   <Skeleton className="h-32 w-full rounded-xl" />  // card-sized block
 *
 * Prefer `SkeletonRow` / `SkeletonCard` / `SkeletonTable` for common patterns.
 */
type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden bg-zinc-800/60 rounded-lg ${className}`}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

/** Single-row pattern: small avatar + two text lines. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/** Card pattern: header + body lines + chart placeholder. */
export function SkeletonCard() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}

/** Table pattern — N rows of column skeletons. */
export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
      <div
        className="px-6 py-4 border-b border-zinc-800 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="px-6 py-4 border-b border-zinc-800/40 grid gap-4 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

"use client";

export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-800/50 ${className}`} />
  );
}

import Image from "next/image";
import Link from "next/link";
import type { TimelineEntry } from "@/lib/background/timeline";

/**
 * Tiny chair portrait + name pill for the Heatmap column headers. Five of
 * these sit in a row above the regime labels, so the photo has to be
 * smaller and rounder than MiniExhibit's 120px portrait. Click → jump to
 * the chair's full exhibit on /background.
 */
export function RegimeChip({
  entry,
  chairLabel,
}: {
  entry: TimelineEntry;
  chairLabel: string;
}) {
  return (
    <Link
      href={`/background#${entry.id}`}
      className="group flex items-center gap-2"
      aria-label={`${chairLabel} — read on the timeline`}
    >
      <span className="relative inline-block h-9 w-9 overflow-hidden rounded-full border border-ink-700 bg-paper-2">
        <Image
          src={`/background/${entry.photo}.jpg`}
          alt={entry.photoAlt}
          fill
          sizes="36px"
          className="object-cover object-top grayscale transition duration-300 group-hover:grayscale-0"
        />
      </span>
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500 group-hover:text-oxblood">
        {chairLabel}
      </span>
    </Link>
  );
}

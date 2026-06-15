import Image from "next/image";
import Link from "next/link";
import { threadLabel, type TimelineEntry } from "@/lib/background/timeline";

export interface MiniExhibitProps {
  entry: TimelineEntry;
  /**
   * Optional override for the "Read on the timeline →" link. Defaults to
   * `/background#${entry.id}`. Pass null/undefined to use the default; pass
   * a string to point somewhere else.
   */
  href?: string;
}

/**
 * Compact museum exhibit for embedding on feature pages — homepage,
 * /decompose, /fed-chair scenarios. ~120px portrait beside title + body +
 * source citation. Same grayscale-on-rest, color-on-hover treatment as the
 * full Exhibit so the visual language is consistent across the site.
 *
 * Stacks to single-column on narrow viewports.
 */
export function MiniExhibit({ entry, href }: MiniExhibitProps) {
  const target = href ?? `/background#${entry.id}`;
  return (
    <aside className="grid gap-4 border border-ink-700 bg-paper-2/40 p-4 md:grid-cols-[120px_1fr] md:gap-5 md:p-5">
      <Link href={target} className="group block" aria-label={`Read ${entry.title} on the timeline`}>
        <div className="relative aspect-[4/5] overflow-hidden border border-ink-700 bg-paper-2">
          <Image
            src={`/background/${entry.photo}.jpg`}
            alt={entry.photoAlt}
            fill
            sizes="(min-width: 768px) 120px, 50vw"
            className="object-cover object-top grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        </div>
      </Link>

      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[14px] font-medium leading-none text-ink-700">
            {entry.year}
          </span>
          <span
            className={`inline-block border px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] ${
              entry.thread === "fed"
                ? "border-oxblood/40 text-oxblood"
                : "border-teal/60 text-teal"
            }`}
          >
            {threadLabel[entry.thread]}
          </span>
        </div>
        <h3 className="mt-2 font-serif text-title-2 leading-tight text-ink-700">
          <Link href={target} className="hover:underline">
            {entry.title}
          </Link>
        </h3>
        {entry.subtitle && (
          <p className="mt-0.5 font-serif text-[12px] italic text-ink-400">{entry.subtitle}</p>
        )}
        <p className="mt-2 max-w-[60ch] font-serif text-[13px] leading-[1.55] text-ink-500">
          {entry.body}
        </p>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-sans text-[10px] uppercase tracking-[0.08em] text-ink-400">
          <Link
            href={target}
            className="font-semibold text-oxblood hover:underline"
          >
            Read on the timeline →
          </Link>
          <span className="text-ink-400">
            Source ·{" "}
            <a
              href={entry.source.url}
              target="_blank"
              rel="noreferrer"
              className="text-ink-500 underline hover:text-ink-700"
            >
              {entry.source.label}
            </a>
          </span>
        </p>
      </div>
    </aside>
  );
}

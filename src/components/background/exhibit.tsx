import Image from "next/image";
import { threadLabel, type TimelineEntry } from "@/lib/background/timeline";

/**
 * Full museum-style exhibit card used by the /background page. Year + thread
 * chip on the left, large 4:5 portrait + headline + body + source on the
 * right. Pass `reverse` to alternate the photo position.
 */
export function Exhibit({ entry, reverse }: { entry: TimelineEntry; reverse: boolean }) {
  return (
    <article
      id={entry.id}
      className="scroll-mt-[140px] grid gap-6 md:grid-cols-[88px_1fr] md:gap-8"
    >
      <div className="md:pt-1">
        <div className="font-mono text-[26px] font-medium leading-none text-ink-700">
          {entry.year}
        </div>
        <div
          className={`mt-2 inline-block border px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] ${
            entry.thread === "fed"
              ? "border-oxblood/40 text-oxblood"
              : "border-teal/60 text-teal"
          }`}
        >
          {threadLabel[entry.thread]}
        </div>
      </div>

      <div
        className={`grid gap-6 md:grid-cols-[240px_1fr] md:gap-8 ${
          reverse ? "md:[&>figure]:order-2" : ""
        }`}
      >
        <figure className="group">
          <div className="relative aspect-[4/5] overflow-hidden border border-ink-700 bg-paper-2">
            <Image
              src={`/background/${entry.photo}.jpg`}
              alt={entry.photoAlt}
              fill
              sizes="(min-width: 768px) 240px, 100vw"
              className="object-cover object-top grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
            />
          </div>
          <figcaption className="mt-2 font-sans text-[10px] uppercase tracking-[0.08em] text-ink-400">
            {entry.photoCredit}
          </figcaption>
        </figure>

        <div className="min-w-0">
          <h3 className="font-serif text-title-1 leading-tight text-ink-700">{entry.title}</h3>
          {entry.subtitle && (
            <p className="mt-1 font-serif text-[13px] italic text-ink-400">{entry.subtitle}</p>
          )}
          <p className="mt-4 max-w-[58ch] font-serif text-[15px] leading-[1.6] text-ink-500">
            {entry.body}
          </p>
          <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.1em] text-ink-400">
            Source ·{" "}
            <a
              href={entry.source.url}
              target="_blank"
              rel="noreferrer"
              className="text-ink-500 underline hover:text-ink-700"
            >
              {entry.source.label}
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}

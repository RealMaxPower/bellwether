import * as React from "react";

export interface MetaRow {
  label: string;
  value: string;
}

export interface PageHeroProps {
  /** Section number, padded to 2 digits ("01", "02", ...). */
  number: number;
  /** Eyebrow text after the section number, e.g. "Master Timeline". */
  eyebrow: string;
  /** Display headline. Wrap the highlighted span in <em> for the oxblood treatment. */
  headline: React.ReactNode;
  /** Lede paragraph below the headline. */
  lede: React.ReactNode;
  /** Right-side metadata rows. */
  meta: readonly MetaRow[];
}

export function PageHero({ number, eyebrow, headline, lede, meta }: PageHeroProps) {
  const num = String(number).padStart(2, "0");
  return (
    <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 border-b border-paper-edge px-8 pb-7 pt-10 lg:grid-cols-[1fr_320px] lg:items-end">
      <div>
        <p className="eyebrow mb-6">
          <span className="text-ink-300">{num} ·</span> {eyebrow}
        </p>
        <h1 className="max-w-[14ch] font-serif text-[clamp(2.5rem,5vw+1rem,3.75rem)] font-normal italic leading-[1.0] tracking-[-0.025em] text-ink-700 [&_em]:not-italic [&_em]:font-semibold [&_em]:text-oxblood">
          {headline}
        </h1>
        <p className="mt-6 max-w-[60ch] font-serif text-[17px] leading-[1.55] text-ink-500">
          {lede}
        </p>
      </div>

      <dl className="font-sans text-[11px] tracking-[0.06em] text-ink-400">
        {meta.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-baseline justify-between border-t border-paper-edge py-2 ${
              i === meta.length - 1 ? "border-b" : ""
            }`}
          >
            <dt>{row.label}</dt>
            <dd className="font-mono text-[12px] font-semibold tracking-normal text-ink-700">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

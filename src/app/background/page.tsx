import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { DecadeNav } from "@/components/background/decade-nav";
import { Exhibit } from "@/components/background/exhibit";
import { decades, timelineEntries } from "@/lib/background/timeline";

export const metadata = {
  title: "Background — Bellwether",
  description:
    "An illustrated timeline of the Federal Reserve and the ISM Manufacturing PMI, from the 1913 Fed Act to today — portraits, primary sources, and the institutional context behind the data on this site.",
};

export default function BackgroundPage() {
  const firstYear = timelineEntries[0]!.year;
  const lastYear = timelineEntries[timelineEntries.length - 1]!.year;

  return (
    <div className="bg-paper">
      <PageHero
        number={5}
        eyebrow="Background · Illustrated timeline"
        headline={
          <>
            Two institutions, <em>one timeline</em>.
          </>
        }
        lede={
          <>
            How the Federal Reserve (1913→) and the ISM Manufacturing PMI (NAPM, 1915→) actually
            came to be. Each exhibit below pairs a primary-source portrait with a museum label and a
            citation. Scroll, or jump by decade.
          </>
        }
        meta={[
          { label: "Exhibits", value: String(timelineEntries.length) },
          { label: "Coverage", value: `${firstYear} → ${lastYear}` },
          { label: "Photo source", value: "Wikimedia · LoC" },
          { label: "Rights", value: "Public domain" },
        ]}
      />

      <div className="mx-auto grid max-w-[1280px] gap-10 px-8 py-10 lg:grid-cols-[160px_1fr]">
        <DecadeNav decades={decades} />

        <div className="min-w-0">
          {decades.map((decade) => {
            const inDecade = timelineEntries.filter((e) => e.decade === decade);
            return (
              <section
                key={decade}
                id={`decade-${decade}`}
                aria-label={`${decade}s`}
                className="scroll-mt-[140px]"
              >
                <header className="mb-6 flex items-baseline gap-4 border-t border-ink-700 pt-6">
                  <span className="font-serif text-[32px] italic leading-none text-ink-700">
                    {decade}s
                  </span>
                  <span className="ml-auto font-sans text-[10px] uppercase tracking-[0.14em] text-ink-400">
                    {inDecade.length} exhibit{inDecade.length === 1 ? "" : "s"}
                  </span>
                </header>

                <div className="mb-14 space-y-12">
                  {inDecade.map((entry, i) => (
                    <Exhibit key={entry.id} entry={entry} reverse={i % 2 === 1} />
                  ))}
                </div>
              </section>
            );
          })}

          <footer className="mt-16 border-t border-ink-100 pt-6 font-serif text-[14px] leading-[1.55] text-ink-500">
            <p>
              Five of the chairs above face you in the{" "}
              <Link href="/fed-chair" className="underline hover:text-ink-700">
                decision game
              </Link>
              . For where every number on the site comes from, see{" "}
              <Link href="/about-the-data" className="underline hover:text-ink-700">
                How accurate is this?
              </Link>{" "}
              For the editorial method behind policy interpretations, see{" "}
              <Link href="/about" className="underline hover:text-ink-700">
                About
              </Link>
              .
            </p>
            <p className="mt-3 text-caption text-ink-400">
              Portraits sourced from Wikimedia Commons and the Library of Congress; all are works
              of the U.S. federal government or otherwise in the public domain. If you spot an
              attribution error, please open an issue.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}


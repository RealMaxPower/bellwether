import Link from "next/link";
import { scenarios } from "@/lib/fed-chair/scenarios";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/layout/page-hero";
import { getPMI } from "@/lib/data/series";

export default function FedChairIndexPage() {
  const pmi = getPMI();
  const last = pmi.observations[pmi.observations.length - 1];
  if (!last) throw new Error("PMI series has no observations");
  const scenarioYears = scenarios.map((s) => parseInt(s.decisionDate.slice(0, 4), 10));
  const coverageStart = Math.min(...scenarioYears);
  const coverageEnd = last.date.slice(0, 4);

  return (
    <div className="bg-paper">
      <PageHero
        number={3}
        eyebrow="You are the Fed Chair"
        headline={
          <>
            Decide with the data <em>they had then</em>.
          </>
        }
        lede={
          <>
            Five inflection points, five charts that hide everything past the day of decision.
            Read the briefing, pick your action, then see what actually happened — and how three
            schools of thought read it.
          </>
        }
        meta={[
          { label: "Series", value: "NAPM" },
          { label: "Frequency", value: "Monthly" },
          { label: "Source", value: "FRED + ISM" },
          { label: "Coverage", value: `${coverageStart} → ${coverageEnd}` },
        ]}
      />

      <div className="mx-auto max-w-[1280px] px-8 py-7">
        <section className="mb-6 max-w-[68ch] font-serif text-[14px] leading-[1.55] text-ink-500">
          <p>
            The Federal Reserve was created in 1913 and has had sixteen chairs since. The five
            scenarios below cover the modern era — Volcker, Greenspan, Bernanke, Yellen, and
            Powell.{" "}
            <Link
              href="/background#fed-act-1913"
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-oxblood hover:underline"
            >
              Walk the illustrated timeline →
            </Link>
          </p>
        </section>
        <ul className="grid gap-px border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s, i) => (
            <li key={s.id}>
              <Link href={`/fed-chair/${s.id}`} className="block h-full">
                <Card className="h-full border-0 bg-paper transition-colors hover:bg-paper-2">
                  <CardContent className="space-y-2 px-5 py-5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                      Scenario {i + 1} · {s.era}
                    </p>
                    <h2 className="font-serif text-title-1 text-ink-700">{s.title}</h2>
                    <p className="font-mono text-[11px] text-ink-500">
                      Decision date: {s.decisionDate}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
          {/* Pad the last row so the bg-ink-700 backdrop never shows through.
              LCM(2,3)=6 covers both the sm and lg column counts. */}
          {Array.from({ length: (6 - (scenarios.length % 6)) % 6 }).map((_, i) => (
            <li key={`placeholder-${i}`} aria-hidden className="bg-paper" />
          ))}
        </ul>
      </div>
    </div>
  );
}

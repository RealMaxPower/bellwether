import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <p className="mb-2 text-caption uppercase tracking-wider text-accent-dark">About</p>
      <h1 className="font-serif text-display-2 text-ink-700">Editorial method.</h1>

      <div className="editorial-prose mt-8">
        <p>
          Bellwether is a free, public reference for the ISM PMI suite — Manufacturing
          (1948→present) and Services / NMI (1997→present) — in its full historical and policy
          context. Three of the four interactive modes (Timeline, Decompose, Heatmap) cover both
          reports; only Fed Chair remains Manufacturing-only, because its scenarios pre-date the
          1997 launch of the Services PMI. The site is built around a simple editorial commitment:
          economists disagree, and that disagreement is itself the lesson. Each policy event opens
          three competing readings — typically a Keynesian, a monetarist, and a third frame chosen
          for its relevance to that policy.
        </p>
        <p>
          Where the literature genuinely converges, we say so. Where it does not, we present the
          best-faith case for each side without picking a winner. The goal is to give the reader
          enough scaffolding to make their own judgments, not to flatten the debate.
        </p>
        <p>
          Time-series data comes from four places. FRED (Federal Reserve Bank of St. Louis)
          supplies industrial production (INDPRO, IPMAN), the effective Fed Funds rate, and the
          NBER recession indicator. The Institute for Supply Management&rsquo;s headline PMI
          composite is the trickier case — FRED removed the ISM series in June 2016 when ISM
          tightened licensing — so the long historical 1948→August 2014 series is mirrored from{" "}
          <a
            href="https://www.forecasts.org/data/data/NAPM.htm"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-ink-700"
          >
            forecasts.org
          </a>{" "}
          (with attribution to ISM as primary origin). The 2014→present headline plus the five
          subindices plus the per-month industry-level growth lists are scraped from snapshots of
          ISM&rsquo;s monthly Report on Business pages on the{" "}
          <a
            href="https://web.archive.org/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-ink-700"
          >
            Internet Archive&rsquo;s Wayback Machine
          </a>
          , so each row links back to the specific archived page it came from. Because Wayback
          captures of ismworld.org lag the live release by several months, the most recent
          headline prints come instead from ISM&rsquo;s monthly press releases on{" "}
          <a
            href="https://www.prnewswire.com/news/institute-for-supply-management/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-ink-700"
          >
            PRNewswire
          </a>{" "}
          — the URL slug encodes the value and month, the page <code>&lt;title&gt;</code>{" "}
          verifies it, and the row keeps the press-release URL as its citation. Recession peaks
          and troughs follow the NBER Business Cycle Dating Committee.
        </p>
        <p>
          Editorial citations on the policy cards and the illustrated timeline at{" "}
          <Link href="/background" className="underline hover:text-ink-700">
            /background
          </Link>{" "}
          point at primary sources where they exist —{" "}
          <a
            href="https://www.federalreservehistory.org/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-ink-700"
          >
            federalreservehistory.org
          </a>{" "}
          for chair tenures and Fed-related essays, government release pages from BEA, BLS, and
          the White House for individual fact citations within policy interpretations, and ISM
          news releases (live or archived) for the monthly commentary quoted in policy cards.
          Where ISM monthly comments are quoted, they are attributed and dated.
        </p>
        <p>
          Per-cell provenance for every number on the site — including which observations are
          hand-curated vs. scraped vs. synthetic placeholders — is tracked at{" "}
          <Link href="/about-the-data" className="underline hover:text-ink-700">
            /about-the-data
          </Link>
          .
        </p>
        <p>
          Bellwether is run as a personal project. It is not affiliated with any of the data
          providers above. The codebase is open and the editorial sources are linked in every
          policy card. If you spot an error or a missing event, please open an issue.
        </p>
      </div>
    </div>
  );
}

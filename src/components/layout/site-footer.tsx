import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink-700 bg-paper">
      <div className="container flex flex-col gap-6 py-6 font-sans text-[11px] tracking-[0.06em] text-ink-400 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="font-serif text-[16px] font-medium tracking-tight text-ink-700">
            Bellwether
          </div>
          <p className="max-w-md font-serif text-[13px] tracking-normal text-ink-500">
            A free, public reference for understanding the ISM PMI suite — Manufacturing
            (1948→present) and Services (1997→present) — in historical and policy context. No
            signup, no ads, no tracking.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-ink-500">Data sources</span>
          <a
            href="https://fred.stlouisfed.org/"
            className="hover:text-ink-700"
            target="_blank"
            rel="noreferrer"
          >
            FRED — Federal Reserve Bank of St. Louis
          </a>
          <a
            href="https://www.ismworld.org/"
            className="hover:text-ink-700"
            target="_blank"
            rel="noreferrer"
          >
            Institute for Supply Management
          </a>
          <a
            href="https://www.bea.gov/"
            className="hover:text-ink-700"
            target="_blank"
            rel="noreferrer"
          >
            BEA · BLS
          </a>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-ink-500">About</span>
          <Link href="/about" className="hover:text-ink-700">
            Editorial method
          </Link>
          <Link href="/background" className="hover:text-ink-700">
            Background &amp; history
          </Link>
          <Link href="/about-the-data" className="hover:text-ink-700">
            How accurate is this?
          </Link>
          <a
            href="https://github.com/RealMaxPower/bellwether"
            className="hover:text-ink-700"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>

        <div className="text-ink-500">
          <p className="font-serif text-[13px] italic text-ink-500">by Max</p>
          <p className="mt-1">Built with Claude Code · Released into the public domain</p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/", label: "Timeline" },
  { href: "/decompose", label: "Decompose" },
  { href: "/fed-chair", label: "Fed Chair" },
  { href: "/heatmap", label: "Heatmap" },
  { href: "/pmi-explained", label: "Explained" },
  { href: "/about", label: "About" },
];

const SOURCE_URL = "https://github.com/RealMaxPower/bellwether";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Compute the "Live" date in an effect rather than during render so the
  // initial HTML (whether statically generated or server-rendered) doesn't
  // bake in a build-time date that then diverges across cached pages.
  const [today, setToday] = React.useState<string | null>(null);
  React.useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    );
  }, []);

  return (
    // One sticky wrapper for masthead + tabs, so the tabs never need a
    // hard-coded offset matching the masthead's height (which varies by width).
    <div className="sticky top-0 z-50">
      <header className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 border-b border-ink-700 bg-paper px-4 pb-3 pt-3.5 sm:gap-6 sm:px-8">
        <div className="flex items-center gap-4 font-sans text-[11px] uppercase tracking-widest text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-[5px] w-[5px] rounded-full bg-oxblood animate-live-pulse"
            />
            Live
          </span>
          <span className="hidden min-w-[18ch] md:inline-block" suppressHydrationWarning>
            {today ?? " "}
          </span>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="block font-serif text-[38px] font-medium leading-none tracking-[-0.03em] text-ink-700"
          >
            Bell<span className="italic">wether</span>
          </Link>
          {/* Below lg the tagline squeezes the side columns and pushes the wordmark off-centre. */}
          <div className="mt-1 hidden items-center justify-center gap-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-400 lg:flex">
            <span aria-hidden className="h-px w-6 bg-paper-edge" />
            <span aria-hidden className="text-[12px] leading-none text-oxblood">❦</span>
            <span>ISM PMI Atlas — Manufacturing &amp; Services</span>
            <span aria-hidden className="text-[12px] leading-none text-oxblood">❦</span>
            <span aria-hidden className="h-px w-6 bg-paper-edge" />
          </div>
        </div>

        <div className="flex items-end justify-end gap-1.5">
          <ThemeToggle />
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden border border-paper-edge px-3.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400 transition-colors hover:border-ink-700 hover:bg-ink-700 hover:text-paper lg:block"
          >
            Source
          </a>
          <MobileMenu pathname={pathname} open={menuOpen} onOpenChange={setMenuOpen} />
        </div>
      </header>

      {/* The tab row needs ~830px; below lg the sections live in MobileMenu instead. */}
      <nav aria-label="Primary" className="hidden border-b border-ink-700 bg-paper px-8 lg:flex">
        {NAV.map((item, i) => {
          const active = pathname === item.href;
          const num = String(i + 1).padStart(2, "0");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-2.5 border-b-2 px-5 pb-3 pt-3.5 font-sans text-[12px] font-medium uppercase tracking-[0.08em] transition-colors",
                active
                  ? "border-oxblood font-semibold text-ink-700"
                  : "border-transparent text-ink-400 hover:text-ink-700",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[10px] font-normal",
                  active ? "text-oxblood" : "text-ink-300",
                )}
              >
                {num}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function MobileMenu({
  pathname,
  open,
  onOpenChange,
}: {
  pathname: string | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex h-[30px] w-[34px] items-center justify-center border border-paper-edge text-ink-400 transition-colors hover:border-ink-700 hover:bg-ink-700 hover:text-paper lg:hidden"
        >
          <Menu aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="w-[320px] px-6">
        <SheetTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          Sections
        </SheetTitle>
        <nav aria-label="Primary" className="mt-6 border-t border-ink-700">
          {NAV.map((item, i) => {
            const active = pathname === item.href;
            const num = String(i + 1).padStart(2, "0");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                // Tapping the current section doesn't change the route, so close explicitly.
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-baseline gap-3 border-b border-paper-edge py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] transition-colors",
                  active ? "font-semibold text-ink-700" : "text-ink-400 hover:text-ink-700",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] font-normal",
                    active ? "text-oxblood" : "text-ink-300",
                  )}
                >
                  {num}
                </span>
                {item.label}
                {active && <span aria-hidden className="ml-auto h-1.5 w-1.5 self-center bg-oxblood" />}
              </Link>
            );
          })}
        </nav>
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 self-start border border-paper-edge px-3.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400 transition-colors hover:border-ink-700 hover:bg-ink-700 hover:text-paper"
        >
          Source on GitHub
        </a>
      </SheetContent>
    </Sheet>
  );
}

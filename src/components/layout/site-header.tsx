"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV = [
  { href: "/", label: "Timeline" },
  { href: "/decompose", label: "Decompose" },
  { href: "/fed-chair", label: "Fed Chair" },
  { href: "/heatmap", label: "Heatmap" },
  { href: "/pmi-explained", label: "Explained" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
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
    <>
      <header className="sticky top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-b border-ink-700 bg-paper px-8 pb-3 pt-3.5">
        <div className="flex items-center gap-4 font-sans text-[11px] uppercase tracking-[0.1em] text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-[5px] w-[5px] rounded-full bg-oxblood animate-live-pulse"
            />
            Live
          </span>
          <span className="hidden min-w-[18ch] md:inline-block" suppressHydrationWarning>
            {today ?? " "}
          </span>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="block font-serif text-[38px] font-medium leading-none tracking-[-0.03em] text-ink-700"
          >
            Bell<span className="italic">wether</span>
          </Link>
          <div className="mt-1 flex items-center justify-center gap-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-400">
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
            href="https://github.com/RealMaxPower/bellwether"
            target="_blank"
            rel="noreferrer"
            className="border border-paper-edge px-3.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400 transition-colors hover:border-ink-700 hover:bg-ink-700 hover:text-paper"
          >
            Source
          </a>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="sticky top-[76px] z-40 flex border-b border-ink-700 bg-paper px-8"
      >
        {NAV.map((item, i) => {
          const active = pathname === item.href;
          const num = String(i + 1).padStart(2, "0");
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </>
  );
}

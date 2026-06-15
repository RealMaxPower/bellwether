"use client";

import * as React from "react";

export interface DecadeNavProps {
  decades: readonly number[];
}

/**
 * Sticky decade navigator. Highlights the decade closest to the top of the
 * viewport as the user scrolls. Click to jump to that decade's first exhibit.
 */
export function DecadeNav({ decades }: DecadeNavProps) {
  const [active, setActive] = React.useState<number>(decades[0] ?? 0);

  React.useEffect(() => {
    const els = decades
      .map((d) => document.getElementById(`decade-${d}`))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const id = visible.target.id;
          const num = Number(id.replace("decade-", ""));
          if (!Number.isNaN(num)) setActive(num);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [decades]);

  return (
    <nav
      aria-label="Decades"
      className="sticky top-[140px] hidden flex-col gap-1 self-start font-sans text-[11px] uppercase tracking-[0.1em] lg:flex"
    >
      <span className="mb-2 text-ink-300">Decades</span>
      {decades.map((d) => {
        const isActive = d === active;
        return (
          <a
            key={d}
            href={`#decade-${d}`}
            className={`group flex items-center justify-between border-l-2 py-1 pl-3 pr-1 transition-colors ${
              isActive
                ? "border-oxblood font-semibold text-ink-700"
                : "border-paper-edge text-ink-400 hover:border-ink-700 hover:text-ink-700"
            }`}
          >
            <span>{d}s</span>
            {isActive && (
              <span aria-hidden className="font-mono text-[10px] text-oxblood">
                ●
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}

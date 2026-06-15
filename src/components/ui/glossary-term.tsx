"use client";

import * as React from "react";
import { glossaryData } from "@/lib/content/glossary-data";
import type { GlossaryTerm as GlossaryTermData } from "@/lib/content/glossary-schema";
import { cn } from "@/lib/utils";

const BY_SLUG: ReadonlyMap<string, GlossaryTermData> = new Map(
  glossaryData.map((t) => [t.slug, t]),
);

export interface GlossaryTermProps {
  /** Slug of an entry in src/lib/content/glossary-data.ts */
  slug: string;
  /** Inline text shown to the reader (often the same as `term`, but can differ). */
  children: React.ReactNode;
  /** Optional class for the inline trigger button. */
  className?: string;
}

/**
 * Inline glossary trigger. Renders `children` with a dotted underline; click or
 * keyboard activation reveals a popover with the canonical definition. Falls
 * back to plain text if the slug is unknown — soft failure beats a thrown
 * exception in editorial prose.
 */
export function GlossaryTerm({ slug, children, className }: GlossaryTermProps) {
  const data = BY_SLUG.get(slug);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!data) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "border-b border-dotted border-ink-400 text-ink-700 transition-colors hover:border-oxblood hover:text-oxblood focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-700",
          open && "border-oxblood text-oxblood",
          className,
        )}
      >
        {children}
      </button>
      {open && (
        <span
          ref={popoverRef as unknown as React.RefObject<HTMLSpanElement>}
          role="dialog"
          aria-label={`Glossary: ${data.term}`}
          className="absolute left-0 top-full z-30 mt-2 block w-[320px] max-w-[88vw] border border-ink-700 bg-paper p-3 font-sans text-[12px] leading-relaxed text-ink-700 shadow-drawer"
        >
          <span className="block font-serif text-[13px] font-semibold not-italic text-ink-700">
            {data.term}
          </span>
          <span className="mt-1.5 block text-ink-500">{data.definition}</span>
        </span>
      )}
    </span>
  );
}

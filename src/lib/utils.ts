import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's default theme. Register the custom
 * scales from globals.css's @theme so it doesn't misread them — e.g. treating
 * `text-caption` as a colour and dropping it next to `text-ink-400`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-1", "display-2", "title-1", "title-2", "body-lg", "body", "caption"],
      shadow: ["card", "drawer"],
      animate: ["fade-in", "slide-in-right", "live-pulse"],
    },
  },
});

/** Conditional className helper used by all UI primitives. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Slugify titles into URL-safe ids. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Format a YYYY-MM-01 ISO date as "Aug 1979". */
export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-");
  if (!y || !m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1] ?? m} ${y}`;
}

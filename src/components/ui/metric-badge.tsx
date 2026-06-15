import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  hint?: string;
}

/** Editorial metric card — used in Fed Chair dossier and About page. */
export function MetricBadge({ label, value, hint, className, ...props }: MetricBadgeProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-ink-100 bg-paper p-4 shadow-card",
        className,
      )}
      {...props}
    >
      <span className="text-caption uppercase tracking-wider text-ink-400">{label}</span>
      <span className="mt-1 font-serif text-title-1 text-ink-700">{value}</span>
      {hint && <span className="mt-1 text-caption text-ink-400">{hint}</span>}
    </div>
  );
}

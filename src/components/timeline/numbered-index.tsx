"use client";

import * as React from "react";
import type { PolicyFrontmatter, PolicyKind } from "@/lib/content/policy-schema";

export interface NumberedIndexProps {
  policies: readonly PolicyFrontmatter[];
  onSelect: (id: string) => void;
}

const KIND_LABEL: Record<PolicyKind, string> = {
  monetary: "Monetary",
  fiscal: "Fiscal",
  trade: "Trade",
  regulatory: "Regulatory",
  exogenous: "Exogenous",
};
const KIND_TEXT: Record<PolicyKind, string> = {
  monetary: "text-policy-monetary",
  fiscal: "text-policy-fiscal",
  trade: "text-policy-trade",
  regulatory: "text-policy-regulatory",
  exogenous: "text-policy-exogenous",
};
const KIND_BORDER: Record<PolicyKind, string> = {
  monetary: "border-policy-monetary",
  fiscal: "border-policy-fiscal",
  trade: "border-policy-trade",
  regulatory: "border-policy-regulatory",
  exogenous: "border-policy-exogenous",
};

/**
 * Index of policy events shown beneath the master timeline. The numbering
 * matches the circles on the chart spine. Click any card to open the same
 * interpretation drawer.
 */
export function NumberedIndex({ policies, onSelect }: NumberedIndexProps) {
  const ordered = React.useMemo(
    () => [...policies].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [policies],
  );

  // The grid's bg-ink-700 fills the gap-px tracks. Empty cells in the last row
  // expose that backdrop as a black panel; pad to the largest column count
  // (4 at lg) so every track is covered. 12 = LCM(1,2,4) so it's safe at every
  // breakpoint too.
  const placeholders = (4 - (ordered.length % 4)) % 4;

  return (
    <div className="mt-7">
      <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        Numbered index · {ordered.length} events on the spine
      </p>
      <ul className="grid grid-cols-1 gap-px border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4">
        {ordered.map((policy, i) => {
          const n = i + 1;
          const year = policy.startDate.slice(0, 4);
          return (
            <li key={policy.id}>
              <button
                type="button"
                onClick={() => onSelect(policy.id)}
                className="group flex h-full w-full flex-col gap-1.5 bg-paper px-4 py-4 text-left transition-colors hover:bg-paper-2 focus:outline-none focus-visible:bg-paper-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center border ${KIND_BORDER[policy.kind]} ${KIND_TEXT[policy.kind]} font-mono text-[11px] font-semibold rounded-full`}
                  >
                    {n}
                  </span>
                  <span
                    className={`border ${KIND_BORDER[policy.kind]} ${KIND_TEXT[policy.kind]} px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.1em]`}
                  >
                    {KIND_LABEL[policy.kind]}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-ink-400">{year}</span>
                </div>
                <div className="font-serif text-[16px] font-medium leading-[1.2] text-ink-700">
                  {policy.title}
                </div>
                <div className="font-serif text-[12px] italic text-ink-400">
                  {policy.regime}
                </div>
              </button>
            </li>
          );
        })}
        {Array.from({ length: placeholders }).map((_, i) => (
          <li key={`placeholder-${i}`} aria-hidden className="bg-paper" />
        ))}
      </ul>
    </div>
  );
}

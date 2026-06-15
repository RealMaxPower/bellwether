"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type PolicyFrontmatter,
  policyKindLabels,
  economicSchoolLabels,
} from "@/lib/content/policy-schema";
import { formatMonth } from "@/lib/utils";
import { Link as LinkIcon, Quote } from "lucide-react";

export interface PolicyCardProps {
  policy: PolicyFrontmatter | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

/**
 * Drawer-style policy card. Opens on marker click and on direct URL load
 * (via the Timeline page's URL-state effect). All copy is keyboard- and
 * screen-reader-accessible — Radix Dialog handles focus trap.
 */
export function PolicyCard({ policy, open, onOpenChange }: PolicyCardProps) {
  if (!policy) return null;

  const dateLabel = policy.endDate
    ? `${formatMonth(policy.startDate)} – ${formatMonth(policy.endDate)}`
    : formatMonth(policy.startDate);

  const onCopyLink = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("policy", policy.id);
    await navigator.clipboard.writeText(url.toString()).catch(() => undefined);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <Badge variant={policy.kind}>{policyKindLabels[policy.kind]}</Badge>
          <SheetTitle>{policy.title}</SheetTitle>
          <SheetDescription>
            {dateLabel} · {policy.regime}
          </SheetDescription>
        </SheetHeader>

        <Section heading="Summary">
          <p className="text-body text-ink-600">{policy.summary}</p>
        </Section>

        <Section heading="Three readings">
          <div className="space-y-3">
            {policy.interpretations.map((interp, i) => (
              <Card key={i} className="border-ink-100">
                <CardContent className="space-y-2 px-4 py-4">
                  <div className="flex items-center gap-2 text-caption uppercase tracking-wider text-ink-400">
                    <span className="font-medium text-accent-dark">
                      {economicSchoolLabels[interp.school]}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="text-ink-500">{interp.economist}</span>
                  </div>
                  <p className="text-body text-ink-600">{interp.summary}</p>
                  {interp.evidence && (
                    <p className="text-caption text-ink-400">{interp.evidence}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {policy.ismComments.length > 0 && (
          <Section heading="From the ISM monthly report">
            {policy.ismComments.map((comment, i) => (
              <figure key={i} className="border-l-2 border-accent pl-4">
                <Quote className="mb-1 h-4 w-4 text-ink-300" aria-hidden />
                <blockquote className="font-serif text-body italic text-ink-600">
                  &ldquo;{comment.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-2 text-caption text-ink-400">
                  ISM Manufacturing Report on Business, {formatMonth(comment.date)}
                  {comment.industry ? ` · ${comment.industry}` : ""}
                  {comment.sourceUrl && (
                    <>
                      {" · "}
                      <a
                        href={comment.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-ink-700"
                      >
                        view archive
                      </a>
                    </>
                  )}
                </figcaption>
              </figure>
            ))}
          </Section>
        )}

        <Section heading="Sources">
          <ul className="space-y-1.5">
            {policy.sources.map((source, i) => (
              <li key={i} className="flex items-center gap-2">
                {source.kind && (
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wider ${
                      source.kind === "primary"
                        ? "bg-accent-dark/15 text-accent-dark"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {source.kind}
                  </span>
                )}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-caption text-accent-dark hover:underline"
                >
                  <LinkIcon className="h-3 w-3" aria-hidden />
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-[11px] text-ink-400">
            Verified {policy.verifiedAt}
          </p>
        </Section>

        <div className="mt-auto flex items-center gap-2 border-t border-ink-100 pt-4">
          <Button variant="outline" size="sm" onClick={onCopyLink}>
            Copy link
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t border-ink-100 pt-5">
      <h3 className="text-caption font-medium uppercase tracking-wider text-ink-400">{heading}</h3>
      {children}
    </section>
  );
}

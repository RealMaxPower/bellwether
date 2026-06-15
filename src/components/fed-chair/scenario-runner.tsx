"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricBadge } from "@/components/ui/metric-badge";
import { PMITimeline } from "@/components/timeline/pmi-timeline";
import { useFedChairStore } from "@/lib/fed-chair/store";
import {
  rateActionArrows,
  rateActionLabels,
  scenarios,
  type RateAction,
  type Scenario,
} from "@/lib/fed-chair/scenarios";
import type { MonthlyObservation, RecessionPeriod } from "@/lib/data/schemas";
import { Lock, CheckCircle2 } from "lucide-react";

export interface ScenarioRunnerProps {
  scenario: Scenario;
  pmiObservations: readonly MonthlyObservation[];
  recessions: readonly RecessionPeriod[];
}

export function ScenarioRunner({ scenario, pmiObservations, recessions }: ScenarioRunnerProps) {
  const choice = useFedChairStore((s) => s.choices[scenario.id]);
  const recordChoice = useFedChairStore((s) => s.recordChoice);

  const [selected, setSelected] = React.useState<RateAction | null>(choice ?? null);
  const [revealed, setRevealed] = React.useState<boolean>(Boolean(choice));

  React.useEffect(() => {
    if (choice) {
      setSelected(choice);
      setRevealed(true);
    }
  }, [choice]);

  const onLockIn = () => {
    if (!selected) return;
    recordChoice(scenario.id, selected);
    setRevealed(true);
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[5fr_7fr]">
        <article className="space-y-5">
          <div>
            <p className="text-caption uppercase tracking-wider text-accent-dark">
              Scenario {scenarios.findIndex((s) => s.id === scenario.id) + 1} of {scenarios.length} ·{" "}
              {scenario.era}
            </p>
            <h2 className="mt-2 font-serif text-display-2 text-ink-700">{scenario.hookQuestion}</h2>
          </div>
          <div className="editorial-prose">
            {scenario.dossier.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {scenario.metrics.map((m) => (
              <MetricBadge key={m.label} label={m.label} value={m.value} hint={m.hint} />
            ))}
          </div>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="px-5 py-3 text-caption text-ink-600">
              Data through {formatMonthYear(scenario.dataCutoff)} — anything beyond this date is
              hidden until you decide.
            </CardContent>
          </Card>
        </article>

        <div className="space-y-4">
          <Card>
            <CardContent className="px-5 py-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-serif text-title-2 text-ink-700">
                  PMI through {formatMonthYear(scenario.dataCutoff)} — era-locked
                </h3>
                <Badge variant="accent">Hidden after cutoff</Badge>
              </div>
              <PMITimeline
                observations={pmiObservations}
                recessions={recessions}
                maxDate={new Date(scenario.dataCutoff)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 px-5 py-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-title-2 text-ink-700">Your move.</h3>
                {revealed ? (
                  <span className="text-caption text-ink-400">Decision locked</span>
                ) : (
                  <span className="text-caption text-ink-400">Pick a rate action</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {scenario.availableChoices.map((action) => (
                  <ChoiceButton
                    key={action}
                    action={action}
                    selected={selected === action}
                    locked={revealed}
                    actualAction={revealed ? scenario.actualAction : undefined}
                    onSelect={() => !revealed && setSelected(action)}
                  />
                ))}
              </div>
              {!revealed && (
                <p className="text-caption italic text-ink-400">
                  Your choice will be revealed alongside the actual decision and three economist
                  takes.
                </p>
              )}
              {!revealed ? (
                <Button variant="primary" disabled={!selected} onClick={onLockIn}>
                  Lock in decision
                </Button>
              ) : (
                <AfterAction scenario={scenario} userChoice={selected} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ScenarioStepper currentId={scenario.id} />
    </div>
  );
}

function ChoiceButton({
  action,
  selected,
  locked,
  actualAction,
  onSelect,
}: {
  action: RateAction;
  selected: boolean;
  locked: boolean;
  actualAction?: RateAction;
  onSelect: () => void;
}) {
  const isActual = locked && actualAction === action;
  const isUserButWrong = locked && selected && actualAction !== action;
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onSelect}
      className={[
        "flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-xs transition-colors",
        selected && !locked && "border-accent bg-accent/10 text-ink-700",
        !selected && !locked && "border-ink-200 hover:border-accent hover:bg-accent/5",
        isActual && "border-expansion bg-expansion/10 text-expansion",
        isUserButWrong && "border-contraction bg-contraction/10 text-contraction",
        !isActual && !isUserButWrong && locked && "border-ink-100 text-ink-400 opacity-70",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="font-medium">{rateActionLabels[action]}</span>
      <span className="text-base">{rateActionArrows[action]}</span>
      {isActual && <span className="text-[10px] uppercase tracking-wider">Actual</span>}
      {isUserButWrong && <span className="text-[10px] uppercase tracking-wider">Your pick</span>}
    </button>
  );
}

function AfterAction({ scenario, userChoice }: { scenario: Scenario; userChoice: RateAction | null }) {
  return (
    <div className="space-y-4 border-t border-ink-100 pt-4">
      <div className="flex flex-wrap items-baseline gap-3 text-caption">
        <span className="text-ink-400">Your decision</span>
        <span className="font-medium text-ink-700">
          {userChoice ? rateActionLabels[userChoice] : "—"}
        </span>
        <span className="text-ink-400">·</span>
        <span className="text-ink-400">Actual</span>
        <span className="font-medium text-ink-700">{rateActionLabels[scenario.actualAction]}</span>
      </div>
      <p className="text-body text-ink-600">{scenario.outcomeSummary}</p>
      <div className="space-y-3">
        <h4 className="text-caption font-medium uppercase tracking-wider text-ink-400">
          Three readings
        </h4>
        {scenario.interpretations.map((interp, i) => (
          <Card key={i} className="border-ink-100">
            <CardContent className="space-y-1 px-4 py-4">
              <div className="flex items-center gap-2 text-caption uppercase tracking-wider text-ink-400">
                <span className="font-medium text-accent-dark">{interp.school}</span>
                <span aria-hidden>·</span>
                <span>{interp.economist}</span>
              </div>
              <p className="text-body text-ink-600">{interp.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScenarioStepper({ currentId }: { currentId: string }) {
  const choices = useFedChairStore((s) => s.choices);
  return (
    <nav aria-label="Scenarios" className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
      {scenarios.map((s, i) => {
        const completed = Boolean(choices[s.id]);
        const active = s.id === currentId;
        return (
          <a
            key={s.id}
            href={`/fed-chair/${s.id}`}
            className={[
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-caption transition-colors",
              active && "border-ink-700 bg-ink-700 text-paper",
              !active && completed && "border-expansion/40 bg-expansion/10 text-expansion",
              !active && !completed && "border-ink-200 text-ink-500 hover:border-ink-300",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : !active ? (
              <Lock className="h-3.5 w-3.5" />
            ) : null}
            <span>
              {i + 1}. {s.era}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-");
  if (!y || !m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1] ?? m} ${y}`;
}

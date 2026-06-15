import { notFound } from "next/navigation";
import { ScenarioRunner } from "@/components/fed-chair/scenario-runner";
import { MiniExhibit } from "@/components/background/mini-exhibit";
import { findScenario, scenarios } from "@/lib/fed-chair/scenarios";
import { getPMI, getRecessions } from "@/lib/data/series";
import { getScenarioChair } from "@/lib/background/lookup";

export function generateStaticParams() {
  return scenarios.map((s) => ({ id: s.id }));
}

export default async function FedChairScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = findScenario(id);
  if (!scenario) notFound();

  const pmi = getPMI();
  const recessions = getRecessions();
  const chairEntry = getScenarioChair(id);

  return (
    <div className="container py-10 md:py-14">
      {chairEntry && (
        <div className="mb-8">
          <MiniExhibit entry={chairEntry} />
        </div>
      )}
      <ScenarioRunner
        scenario={scenario}
        pmiObservations={pmi.observations}
        recessions={recessions.periods}
      />
    </div>
  );
}

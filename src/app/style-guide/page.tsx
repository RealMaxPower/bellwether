import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricBadge } from "@/components/ui/metric-badge";

export default function StyleGuidePage() {
  // Dev-only — internal reference for visual regression checks. In production
  // builds this route returns 404 so deep-links don't surface it.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <div className="container max-w-4xl space-y-12 py-10 md:py-14">
      <header>
        <p className="mb-2 text-caption uppercase tracking-wider text-accent-dark">Internal</p>
        <h1 className="font-serif text-display-2 text-ink-700">Style guide.</h1>
        <p className="mt-2 text-body-lg text-ink-500">
          Reusable primitives + tokens. Useful for quick visual regression checks.
        </p>
      </header>

      <Section title="Typography">
        <h1 className="font-serif text-display-1 text-ink-700">Display 1 / serif</h1>
        <h2 className="font-serif text-display-2 text-ink-700">Display 2 / serif</h2>
        <h3 className="font-serif text-title-1 text-ink-700">Title 1 / serif</h3>
        <h4 className="font-serif text-title-2 text-ink-700">Title 2 / serif</h4>
        <p className="text-body-lg">
          Body large — used for hero subheads and dossier text. Inter, 1.125rem.
        </p>
        <p className="text-body">Body — default running text.</p>
        <p className="text-caption text-ink-400">Caption — metadata, axis labels.</p>
      </Section>

      <Section title="Color tokens">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {[
            ["paper", "bg-paper border border-ink-100"],
            ["ink-100", "bg-ink-100"],
            ["ink-300", "bg-ink-300"],
            ["ink-500", "bg-ink-500"],
            ["ink-700", "bg-ink-700"],
            ["accent", "bg-accent"],
            ["accent-dark", "bg-accent-dark"],
            ["expansion", "bg-expansion"],
            ["contraction", "bg-contraction"],
            ["policy.monetary", "bg-policy-monetary"],
            ["policy.fiscal", "bg-policy-fiscal"],
            ["policy.exogenous", "bg-policy-exogenous"],
          ].map(([name, cls]) => (
            <div key={name} className="space-y-1 text-center">
              <div className={`h-12 rounded-md ${cls}`} aria-hidden />
              <div className="font-mono text-[11px] text-ink-400">{name}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="monetary">Monetary</Badge>
          <Badge variant="fiscal">Fiscal</Badge>
          <Badge variant="trade">Trade</Badge>
          <Badge variant="regulatory">Regulatory</Badge>
          <Badge variant="exogenous">Exogenous</Badge>
        </div>
      </Section>

      <Section title="Metric badges">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricBadge label="CPI YoY" value="9.1%" />
          <MetricBadge label="Unemployment" value="3.6%" />
          <MetricBadge label="PMI" value="53.0" />
          <MetricBadge label="Fed Funds" value="1.50%" />
        </div>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Subtitle / caption text</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body text-ink-600">
              The Card primitive is used for every interpretation, scenario brief, and metric panel
              throughout the app.
            </p>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-ink-100 pt-6">
      <h2 className="font-serif text-title-1 text-ink-700">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

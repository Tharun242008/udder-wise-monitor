import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { ComparisonBadge, EmptyState, Panel, StatCard, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import { buildInsights, fmt, isolationForest, prettyDate } from "@/lib/dairy/analytics";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights & Anomaly Detection | Smart Dairy Monitor" },
      { name: "description", content: "Isolation Forest anomaly detection and data-based insights computed from your stored milk, feed and health records." },
      { property: "og:title", content: "AI Insights & Anomaly Detection | Smart Dairy Monitor" },
      { property: "og:description", content: "Transparent in-browser anomaly detection over stored dairy records." },
    ],
  }),
  component: InsightsPage,
});

const DIAGRAM = `Real-world source (12 cows, ~40 L/day)
        |
        v
Data acquisition (cow, milk, feed, health, treatment forms)
        |
        v
Pre-processing (total = morning + evening, per-cow sorting,
                3-7 record baseline, change vs baseline)
        |
        v
AI/ML engine — Isolation Forest / Anomaly Detection
                features: total litres, feed kg, change vs previous
        |
        v
Decision logic (threshold rules, schedule date rules)
        |
        v
Farmer dashboard (cards, charts, alerts, cow profiles)
        |
        v
Feedback (farmer records outcome -> new records) --+
        ^                                          |
        +------------------------------------------+`;

function InsightsPage() {
  const { data } = useDairy();
  const insights = buildInsights(data);
  const { points, enoughData } = isolationForest(data);
  const anomalies = points.filter((p) => p.isAnomaly).sort((a, b) => b.score - a.score);
  const flagged = insights.filter((i) => i.comparison.alert || i.anomalyCount > 0);

  return (
    <AppShell>
      <PageHeader
        title="AI Insights"
        subtitle="Computed from your stored records. This is data analysis, not a veterinary diagnosis."
      />
      <DemoBanner />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Records analysed" value={points.length} hint="Milk records across all cows" />
        <StatCard label="Anomaly flags" value={enoughData ? anomalies.length : 0} tone={anomalies.length ? "warning" : "default"} hint={enoughData ? "Top ~8% isolation scores" : "Needs 20+ records"} />
        <StatCard label="Cows needing review" value={flagged.length} tone={flagged.length ? "danger" : "default"} />
      </div>

      <Panel title="Technique: Isolation Forest / Anomaly Detection" className="mb-6">
        <p className="text-sm text-muted-foreground">
          A 100-tree Isolation Forest runs entirely in the browser on the stored records (sub-sample size 64, features:
          total litres, feed kg, change versus the cow's previous record). Records with the highest isolation score are
          flagged as unusual.
        </p>
        <p className="mt-3 rounded-md border border-info/40 bg-info/10 px-3 py-2 text-sm text-info-foreground">
          Stated limitation: the model is fitted on the same small stored dataset it scores, and there is no labelled
          ground truth, so no accuracy figure is claimed or displayed. Flags mean “unusual compared with your own
          records”, not “disease”.
        </p>
        {!enoughData ? (
          <p className="mt-3 text-sm font-medium text-warning-foreground">
            Insufficient recorded data for anomaly detection — at least 20 milk records are needed. Currently {points.length}.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Cow-wise analysis" description="Baseline comparison plus recorded contributing factors">
          {insights.length ? (
            <ul className="space-y-4">
              {insights.map((i) => (
                <li key={i.cowId} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to="/cows/$cowId" params={{ cowId: i.cowId }} className="font-semibold hover:underline">
                      {i.cowId}
                    </Link>
                    <ComparisonBadge cmp={i.comparison} />
                  </div>
                  {i.comparison.hasEnoughData ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Baseline {fmt(i.comparison.baseline!, 2)} L · Current {fmt(i.comparison.current!, 2)} L · Change{" "}
                      {i.comparison.percentChange! > 0 ? "+" : ""}
                      {i.comparison.percentChange!.toFixed(1)}%
                      {i.anomalyCount ? ` · ${i.anomalyCount} anomaly flag(s)` : ""}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm">{i.summary}</p>
                  {i.factors.length ? (
                    <>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Possible contributing factors (recorded)
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {i.factors.map((f, k) => (
                          <li key={k}>{f}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No cows to analyse" body="Add cows and milk records first." />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Anomaly-flagged records" description="Highest isolation scores first">
            {enoughData && anomalies.length ? (
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">Cow</th>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Milk</th>
                      <th className="py-2 pr-3">Feed</th>
                      <th className="py-2 pr-3">Δ vs prev</th>
                      <th className="py-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((a, i) => (
                      <tr key={`${a.cowId}-${a.date}-${i}`} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3 font-semibold">{a.cowId}</td>
                        <td className="py-2 pr-3">{prettyDate(a.date)}</td>
                        <td className="py-2 pr-3">{fmt(a.litres, 2)} L</td>
                        <td className="py-2 pr-3">{fmt(a.feedKg)} kg</td>
                        <td className="py-2 pr-3">{a.deltaFromPrev > 0 ? "+" : ""}{fmt(a.deltaFromPrev, 2)} L</td>
                        <td className="py-2">
                          <Tag tone="warning">{a.score.toFixed(3)}</Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No anomalies flagged"
                body={enoughData ? "No record stands out in the current dataset." : "Add more milk records to enable anomaly detection."}
              />
            )}
          </Panel>

          <Panel title="C29 technical block diagram">
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs leading-relaxed text-muted-foreground">{DIAGRAM}</pre>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

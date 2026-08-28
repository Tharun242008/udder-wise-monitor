import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader } from "@/components/dairy/AppShell";
import { ComparisonBadge, EmptyState, Panel, ScheduleBadge, StatCard, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import {
  buildInsights,
  compareCow,
  cowRecords,
  fmt,
  isolationForest,
  prettyDate,
  scheduleInfo,
  total,
} from "@/lib/dairy/analytics";

export const Route = createFileRoute("/cows/$cowId")({
  head: ({ params }) => ({
    meta: [
      { title: `Cow ${params.cowId} Profile | Smart Dairy Monitor` },
      { name: "description", content: `Milk trend, health observations, treatment schedule and data insights for cow ${params.cowId}.` },
      { property: "og:title", content: `Cow ${params.cowId} Profile | Smart Dairy Monitor` },
      { property: "og:description", content: "Cow-wise history, baseline comparison and anomaly flags." },
    ],
  }),
  component: CowProfile,
});

function CowProfile() {
  const { cowId } = Route.useParams();
  const { data, hydrated } = useDairy();
  const cow = data.cows.find((c) => c.cowId === cowId);

  if (!cow) {
    return (
      <AppShell>
        <PageHeader title={`Cow ${cowId}`} />
        <Panel>
          <EmptyState
            title={hydrated ? "Cow not found" : "Loading records…"}
            body={hydrated ? "This Cow ID does not exist in your stored records." : "Reading data from this browser."}
          />
          <div className="mt-4 text-center">
            <Link to="/cows" className="text-sm font-semibold text-primary hover:underline">
              Back to cows
            </Link>
          </div>
        </Panel>
      </AppShell>
    );
  }

  const recs = cowRecords(data, cowId);
  const cmp = compareCow(data, cowId);
  const insight = buildInsights(data).find((i) => i.cowId === cowId);
  const anomalies = isolationForest(data);
  const cowAnomalies = anomalies.points.filter((p) => p.cowId === cowId && p.isAnomaly);
  const health = data.healthRecords.filter((h) => h.cowId === cowId).sort((a, b) => b.date.localeCompare(a.date));
  const schedules = data.injections
    .filter((i) => i.cowId === cowId)
    .map((i) => scheduleInfo(i, data.settings))
    .sort((a, b) => (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999));

  const chartData = recs.map((r, i) => {
    const prev = i > 0 ? total(recs[i - 1]) : total(r);
    const pct = prev > 0 ? ((total(r) - prev) / prev) * 100 : 0;
    return { date: r.date, litres: Number(total(r).toFixed(2)), feed: r.feedKg, pct: Number(pct.toFixed(1)) };
  });

  return (
    <AppShell>
      <PageHeader
        title={`${cow.cowId} · ${cow.name}`}
        subtitle={`${cow.breed || "Breed not recorded"} · ${cow.age} years · added ${prettyDate(cow.dateAdded)}`}
      >
        <Link to="/cows" className="rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
          Back to cows
        </Link>
      </PageHeader>

      {cow.isDemo ? (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-warning-foreground">
          DEMO DATA — Replace with actual farm records.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Latest milk" value={cmp.current !== null ? `${fmt(cmp.current, 2)} L` : "-"} hint={cmp.currentDate ? prettyDate(cmp.currentDate) : "No records"} />
        <StatCard
          label="Baseline"
          value={cmp.baseline !== null ? `${fmt(cmp.baseline, 2)} L` : "-"}
          hint={cmp.baseline !== null ? `Average of previous ${cmp.baselineCount} records` : "Not enough history"}
        />
        <StatCard
          label="Change"
          value={cmp.percentChange !== null ? `${cmp.percentChange > 0 ? "+" : ""}${cmp.percentChange.toFixed(1)}%` : "-"}
          hint={cmp.absoluteChange !== null ? `${cmp.absoluteChange > 0 ? "+" : ""}${fmt(cmp.absoluteChange, 2)} L vs baseline` : ""}
          tone={cmp.alert ? "danger" : cmp.status === "up" ? "success" : "default"}
        />
        <StatCard label="Anomaly flags" value={cowAnomalies.length} hint="Isolation Forest prototype" tone={cowAnomalies.length ? "warning" : "default"} />
      </div>

      <div className="mt-6">
        <ComparisonBadge cmp={cmp} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Milk trend" description="Total litres per recorded day">
          {chartData.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis unit=" L" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} L`, "Total milk"]} />
                  <Line type="monotone" dataKey="litres" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No milk records" body="Add a milk record for this cow to see the trend." />
          )}
        </Panel>

        <Panel title="Change percentage per record" description="Compared with the previous record for this cow">
          {chartData.length > 1 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Change"]} />
                  <Bar dataKey="pct" fill="var(--chart-3)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Not enough records" body="At least two milk records are needed for change percentages." />
          )}
        </Panel>
      </div>

      <Panel title="Data insights" description="Calculated from stored records only — this is not a medical diagnosis." className="mt-6">
        <p className="text-sm text-foreground">{insight?.summary}</p>
        {insight?.factors.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {insight.factors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        ) : null}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Milk history">
          {recs.length ? (
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Morning</th>
                    <th className="py-2 pr-3">Evening</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Feed</th>
                    <th className="py-2">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recs].reverse().map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3">{prettyDate(r.date)}</td>
                      <td className="py-2 pr-3">{fmt(r.morning, 2)}</td>
                      <td className="py-2 pr-3">{fmt(r.evening, 2)}</td>
                      <td className="py-2 pr-3 font-semibold">{fmt(total(r), 2)} L</td>
                      <td className="py-2 pr-3">{fmt(r.feedKg)} kg</td>
                      <td className="py-2 text-muted-foreground">{r.healthObservation || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No milk records" body="Records added on the Add Milk Record page appear here." />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Health observations">
            {health.length ? (
              <ul className="space-y-3 text-sm">
                {health.map((h) => (
                  <li key={h.id} className="border-b border-border pb-2 last:border-0">
                    <p className="font-semibold">
                      {prettyDate(h.date)} {h.isDemo ? <Tag>Demo</Tag> : null}
                    </p>
                    <p className="text-muted-foreground">
                      Appetite: {h.appetite} · Activity: {h.activity} · General: {h.general}
                    </p>
                    {h.observation ? <p className="mt-1">Recorded observation: {h.observation}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No health observations" body="Add observations on the Health Records page." />
            )}
          </Panel>

          <Panel title="Injection / treatment history & schedule">
            {schedules.length ? (
              <ul className="space-y-3 text-sm">
                {schedules.map((s) => (
                  <li key={s.record.id} className="border-b border-border pb-2 last:border-0">
                    <p className="font-semibold">{s.record.treatment}</p>
                    <p className="text-muted-foreground">
                      Given {prettyDate(s.record.givenDate)} · Next due {prettyDate(s.nextDue)} · Days since {s.daysSinceGiven} ·
                      {" "}
                      Days remaining {s.daysRemaining ?? "-"}
                    </p>
                    <div className="mt-1">
                      <ScheduleBadge info={s} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No treatments recorded" body="Enter treatments and intervals on the Injection Schedule page." />
            )}
          </Panel>
        </div>
      </div>

      {cow.notes ? (
        <Panel title="Notes" className="mt-6">
          <p className="text-sm text-muted-foreground">{cow.notes}</p>
        </Panel>
      ) : null}
    </AppShell>
  );
}

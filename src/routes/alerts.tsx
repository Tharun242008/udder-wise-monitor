import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { ComparisonBadge, EmptyState, Panel, ScheduleBadge, StatCard, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import { allComparisons, allSchedules, fmt, prettyDate } from "@/lib/dairy/analytics";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts | Smart Dairy Monitor" },
      {
        name: "description",
        content:
          "Consolidated alerts for unusual milk production decreases, recorded health observations needing attention and treatment schedules that are due or overdue.",
      },
      { property: "og:title", content: "Alerts | Smart Dairy Monitor" },
      { property: "og:description", content: "Milk drop alerts, health observations and overdue treatment schedules in one place." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data } = useDairy();
  const milkAlerts = allComparisons(data)
    .filter((c) => c.alert)
    .sort((a, b) => (a.percentChange ?? 0) - (b.percentChange ?? 0));
  const schedules = allSchedules(data).filter(
    (s) => s.status === "overdue" || s.status === "due-today" || s.status === "due-soon",
  );
  const healthAlerts = data.healthRecords
    .filter((h) => h.general === "Needs attention" || h.appetite === "Reduced" || h.activity === "Reduced")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  const totalAlerts = milkAlerts.length + schedules.length + healthAlerts.length;
  const nameOf = (cowId: string) => data.cows.find((c) => c.cowId === cowId)?.name ?? "-";

  return (
    <AppShell>
      <PageHeader
        title="Alerts"
        subtitle={`Threshold: a decrease of ${data.settings.milkDropThresholdPct}% or more from a cow's own baseline. Schedule reminders start ${data.settings.scheduleAlertLeadDays} days before the due date.`}
      />
      <DemoBanner />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total alerts" value={totalAlerts} tone={totalAlerts ? "danger" : "success"} />
        <StatCard label="Milk decrease" value={milkAlerts.length} tone={milkAlerts.length ? "danger" : "default"} />
        <StatCard label="Schedule due / overdue" value={schedules.length} tone={schedules.length ? "warning" : "default"} />
        <StatCard label="Health observations" value={healthAlerts.length} tone={healthAlerts.length ? "warning" : "default"} />
      </div>

      <div className="space-y-6">
        <Panel title="Unusual milk production decrease" description="Each cow is compared with its own recent baseline, not with other cows.">
          {milkAlerts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Cow</th>
                    <th className="py-2 pr-3">Latest</th>
                    <th className="py-2 pr-3">Baseline</th>
                    <th className="py-2 pr-3">Change</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {milkAlerts.map((c) => (
                    <tr key={c.cowId} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-semibold">
                        <Link to="/cows/$cowId" params={{ cowId: c.cowId }} className="text-primary hover:underline">
                          {c.cowId}
                        </Link>
                        <span className="ml-2 font-normal text-muted-foreground">{nameOf(c.cowId)}</span>
                      </td>
                      <td className="py-2 pr-3">{fmt(c.current ?? 0, 2)} L</td>
                      <td className="py-2 pr-3">{c.baseline !== null ? `${fmt(c.baseline, 2)} L` : "-"}</td>
                      <td className="py-2 pr-3 text-destructive">{c.percentChange?.toFixed(1)}%</td>
                      <td className="py-2 pr-3">{prettyDate(c.currentDate)}</td>
                      <td className="py-2">
                        <ComparisonBadge cmp={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Unusual production decrease detected. Review recent recorded health, feed and management information. This is not a medical diagnosis.
              </p>
            </div>
          ) : (
            <EmptyState title="No milk decrease alerts" body="No cow is currently below its baseline by more than the configured threshold." />
          )}
        </Panel>

        <Panel title="Treatment schedules due or overdue" description="Based on the given date plus the interval, or the manually entered next due date.">
          {schedules.length ? (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {s.record.cowId} — {s.record.treatment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Given {prettyDate(s.record.givenDate)} · Next due {prettyDate(s.nextDue)} · {s.daysSinceGiven} days since given
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScheduleBadge info={s} />
                    <Link to="/schedule" className="text-sm font-semibold text-primary hover:underline">
                      Open schedule
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No schedule alerts" body="No treatment is due within the reminder window." />
          )}
        </Panel>

        <Panel title="Recorded health observations needing attention" description="Recorded observations only — a veterinarian must confirm any treatment.">
          {healthAlerts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Cow</th>
                    <th className="py-2 pr-3">Appetite</th>
                    <th className="py-2 pr-3">Activity</th>
                    <th className="py-2 pr-3">General</th>
                    <th className="py-2">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {healthAlerts.map((h) => (
                    <tr key={h.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3">{prettyDate(h.date)}</td>
                      <td className="py-2 pr-3 font-semibold">{h.cowId}</td>
                      <td className="py-2 pr-3">{h.appetite}</td>
                      <td className="py-2 pr-3">{h.activity}</td>
                      <td className="py-2 pr-3">
                        <Tag tone={h.general === "Needs attention" ? "danger" : "muted"}>{h.general}</Tag>
                      </td>
                      <td className="py-2 text-muted-foreground">{h.observation || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No health alerts" body="No recorded observation is currently marked as reduced or needing attention." />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Droplets, MilkOff, Syringe, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { ComparisonBadge, EmptyState, Panel, ScheduleBadge, StatCard, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import { allComparisons, allSchedules, dailyTotals, fmt, prettyDate, todayTotals } from "@/lib/dairy/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farm Dashboard | Smart Dairy Monitor" },
      {
        name: "description",
        content:
          "Live farm overview: total cows, today's milk, milk alerts and upcoming treatment schedules from your stored records.",
      },
      { property: "og:title", content: "Farm Dashboard | Smart Dairy Monitor" },
      { property: "og:description", content: "Live overview of herd milk production and health schedules." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, hydrated, loadDemoData } = useDairy();
  const today = todayTotals(data);
  const comparisons = allComparisons(data);
  const alerts = comparisons.filter((c) => c.alert);
  const schedules = allSchedules(data);
  const upcoming = schedules.filter((s) => s.status === "due-soon" || s.status === "due-today");
  const overdue = schedules.filter((s) => s.status === "overdue");
  const chart = dailyTotals(data).slice(-14);

  return (
    <AppShell>
      <PageHeader
        title="Farm Overview"
        subtitle="All values are calculated from the records stored in this browser. Nothing here is hard-coded."
      >
        <div className="flex gap-2">
          <Link
            to="/milk/add"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Droplets className="size-4" /> Add milk record
          </Link>
        </div>
      </PageHeader>

      <DemoBanner />

      {hydrated && data.cows.length === 0 ? (
        <Panel className="mb-6">
          <EmptyState
            title="No records yet"
            body="Add your cows and daily milk records, or load clearly labelled demo data to explore the app."
          />
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/cows" className="rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
              Add cows
            </Link>
            <button
              onClick={loadDemoData}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Load demo data
            </button>
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total cows" value={data.cows.length} icon={<MilkOff className="size-4" />} />
        <StatCard
          label={today.isToday ? "Today's milk" : "Latest recorded day"}
          value={`${fmt(today.litres)} L`}
          hint={today.date ? `${prettyDate(today.date)} · ${today.cowsRecorded} cows recorded` : "No milk records yet"}
          icon={<Droplets className="size-4" />}
        />
        <StatCard
          label="Average per cow"
          value={`${fmt(today.perCow, 2)} L`}
          hint="Latest recorded day"
          icon={<TrendingDown className="size-4" />}
        />
        <StatCard
          label="Milk alerts"
          value={alerts.length}
          tone={alerts.length ? "danger" : "default"}
          hint={`Threshold: ${data.settings.milkDropThresholdPct}% drop vs baseline`}
          icon={<Bell className="size-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Upcoming schedules"
          value={upcoming.length}
          tone={upcoming.length ? "warning" : "default"}
          hint={`Within ${data.settings.scheduleAlertLeadDays} days of the due date`}
          icon={<Syringe className="size-4" />}
        />
        <StatCard
          label="Overdue schedules"
          value={overdue.length}
          tone={overdue.length ? "danger" : "default"}
          hint="Based on farmer/vet entered dates only"
          icon={<Syringe className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Daily total milk production" description="Last 14 recorded days" className="xl:col-span-2">
          {chart.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis unit=" L" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => [`${v} L`, "Total milk"]} />
                  <Line type="monotone" dataKey="litres" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No chart data" body="Save at least one milk record to see the daily production trend." />
          )}
        </Panel>

        <Panel title="Attention list" description="Cows with the largest recorded decrease">
          <ul className="space-y-3">
            {comparisons
              .filter((c) => c.hasEnoughData)
              .sort((a, b) => (a.percentChange ?? 0) - (b.percentChange ?? 0))
              .slice(0, 6)
              .map((c) => (
                <li key={c.cowId} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                  <Link to="/cows/$cowId" params={{ cowId: c.cowId }} className="text-sm font-semibold hover:underline">
                    {c.cowId}
                  </Link>
                  <ComparisonBadge cmp={c} />
                </li>
              ))}
            {!comparisons.some((c) => c.hasEnoughData) ? (
              <li className="text-sm text-muted-foreground">Not enough historical data for reliable comparison.</li>
            ) : null}
          </ul>
        </Panel>
      </div>

      <Panel title="Schedule reminders" description="Date calculations only — the interval or due date comes from you or your veterinarian." className="mt-6">
        {schedules.length ? (
          <ul className="space-y-3">
            {schedules.slice(0, 6).map((s) => (
              <li key={s.record.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-sm font-semibold">
                    {s.record.cowId} — {s.record.treatment} {s.record.isDemo ? <Tag>Demo</Tag> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Given {prettyDate(s.record.givenDate)} · Next due {prettyDate(s.nextDue)} · {s.daysSinceGiven} days since
                  </p>
                </div>
                <ScheduleBadge info={s} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No schedules entered" body="Add a treatment record on the Injection Schedule page to get date reminders." />
        )}
      </Panel>

      <Panel title="Actual farm information (field observations)" className="mt-6">
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>Number of cows: 12</li>
          <li>Approximate total milk production: 40 litres/day</li>
          <li>Milk records currently maintained in a notebook</li>
          <li>Cow health currently monitored visually</li>
          <li>Milk production occasionally decreases by approximately 30%</li>
          <li>Current farmer response: increasing feed</li>
          <li>Manual record maintenance: approximately 20 minutes/day</li>
        </ul>
      </Panel>
    </AppShell>
  );
}

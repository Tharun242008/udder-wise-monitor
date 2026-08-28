import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { EmptyState, Field, Panel, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import { addDaysISO, cowRecords, dailyTotals, fmt, prettyDate, todayISO, total } from "@/lib/dairy/analytics";

export const Route = createFileRoute("/milk/history")({
  head: () => ({
    meta: [
      { title: "Milk History & Charts | Smart Dairy Monitor" },
      { name: "description", content: "Filter stored milk records by date and cow, and view daily totals, cow trends, change percentage and feed-versus-milk charts." },
      { property: "og:title", content: "Milk History & Charts | Smart Dairy Monitor" },
      { property: "og:description", content: "Charts built from your stored daily milk records." },
    ],
  }),
  component: MilkHistory,
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function MilkHistory() {
  const { data, deleteMilkRecord } = useDairy();
  const [from, setFrom] = useState(addDaysISO(todayISO(), -30));
  const [to, setTo] = useState(todayISO());
  const [cowId, setCowId] = useState("");

  const filtered = useMemo(
    () =>
      data.milkRecords
        .filter((r) => r.date >= from && r.date <= to && (!cowId || r.cowId === cowId))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.milkRecords, from, to, cowId],
  );

  const daily = useMemo(
    () => dailyTotals({ ...data, milkRecords: data.milkRecords.filter((r) => r.date >= from && r.date <= to) }),
    [data, from, to],
  );

  const cowTrend = useMemo(() => {
    if (!cowId) return [];
    const recs = cowRecords(data, cowId).filter((r) => r.date >= from && r.date <= to);
    return recs.map((r, i) => {
      const prev = i > 0 ? total(recs[i - 1]) : total(r);
      return {
        date: r.date,
        litres: Number(total(r).toFixed(2)),
        feed: r.feedKg,
        pct: Number((prev > 0 ? ((total(r) - prev) / prev) * 100 : 0).toFixed(1)),
      };
    });
  }, [data, cowId, from, to]);

  const feedVsMilk = useMemo(
    () =>
      filtered
        .filter((r) => r.feedKg > 0)
        .map((r) => ({ feed: r.feedKg, litres: Number(total(r).toFixed(2)), cow: r.cowId })),
    [filtered],
  );

  const sumLitres = filtered.reduce((s, r) => s + total(r), 0);

  return (
    <AppShell>
      <PageHeader
        title="Milk History"
        subtitle="All charts are drawn from stored records. Change the filters to narrow the period or a single cow."
      />
      <DemoBanner />

      <Panel title="Filters" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="From date">
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To date">
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Cow ID">
            <select className={inputCls} value={cowId} onChange={(e) => setCowId(e.target.value)}>
              <option value="">All cows</option>
              {data.cows.map((c) => (
                <option key={c.id} value={c.cowId}>
                  {c.cowId} — {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quick range">
            <select
              className={inputCls}
              onChange={(e) => {
                const d = Number(e.target.value);
                setFrom(addDaysISO(todayISO(), -d));
                setTo(todayISO());
              }}
              defaultValue="30"
            >
              {[7, 14, 30, 90, 365].map((d) => (
                <option key={d} value={d}>
                  Last {d} days
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {filtered.length} records · {fmt(sumLitres, 2)} L total in the selected period
        </p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Chart 1 — Daily total milk production" description="Sum of all cows per recorded day">
          {daily.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis unit=" L" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} L`, "Total milk"]} />
                  <Line type="monotone" dataKey="litres" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Total milk" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No data in this period" body="Widen the date range or add milk records." />
          )}
        </Panel>

        <Panel title="Chart 2 — Selected cow's milk trend" description={cowId ? `Cow ${cowId}` : "Select a cow in the filters"}>
          {cowTrend.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cowTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis unit=" L" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} L`, "Milk"]} />
                  <Line type="monotone" dataKey="litres" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Milk" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No cow trend shown" body="Choose a single Cow ID in the filters to view its own trend." />
          )}
        </Panel>

        <Panel title="Chart 3 — Milk production change percentage" description={cowId ? "Change vs the previous record for this cow" : "Select a cow in the filters"}>
          {cowTrend.length > 1 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cowTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Change"]} />
                  <Bar dataKey="pct" fill="var(--chart-3)" name="Change %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Not enough records" body="At least two records for one cow are needed for change percentages." />
          )}
        </Panel>

        <Panel title="Chart 4 — Feed quantity vs milk production" description="Shown only when enough records with feed data exist">
          {feedVsMilk.length >= 10 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="feed" name="Feed" unit=" kg" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="litres" name="Milk" unit=" L" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={feedVsMilk} fill="var(--chart-4)" name="Record" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Insufficient data for this chart"
              body={`Feed vs milk needs at least 10 records with a feed quantity in the selected period (currently ${feedVsMilk.length}).`}
            />
          )}
        </Panel>
      </div>

      <Panel title="Filtered records" className="mt-6">
        {filtered.length ? (
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Cow</th>
                  <th className="py-2 pr-3">Morning</th>
                  <th className="py-2 pr-3">Evening</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Feed</th>
                  <th className="py-2 pr-3">Observation</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3">{prettyDate(r.date)}</td>
                    <td className="py-2 pr-3 font-semibold">
                      {r.cowId} {r.isDemo ? <Tag>Demo</Tag> : null}
                    </td>
                    <td className="py-2 pr-3">{fmt(r.morning, 2)}</td>
                    <td className="py-2 pr-3">{fmt(r.evening, 2)}</td>
                    <td className="py-2 pr-3 font-semibold">{fmt(total(r), 2)} L</td>
                    <td className="py-2 pr-3">{fmt(r.feedKg)} kg</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.healthObservation || "-"}</td>
                    <td className="py-2 text-right">
                      <button
                        aria-label={`Delete record for ${r.cowId}`}
                        onClick={() => {
                          deleteMilkRecord(r.id);
                          toast.success("Record deleted.");
                        }}
                        className="rounded-md border border-input p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No records match the filters" body="Adjust the date range or cow filter." />
        )}
      </Panel>
    </AppShell>
  );
}

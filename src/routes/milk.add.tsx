import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { ComparisonBadge, EmptyState, Field, Panel, StatCard } from "@/components/dairy/ui";
const fail = (m: string): void => {
  toast.error(m);
};

import { useDairy } from "@/lib/dairy/store";
import { compareCow, fmt, prettyDate, todayISO } from "@/lib/dairy/analytics";

export const Route = createFileRoute("/milk/add")({
  head: () => ({
    meta: [
      { title: "Add Milk Record | Smart Dairy Monitor" },
      { name: "description", content: "Record morning and evening milk, feed quantity and health observations. Total milk is calculated automatically." },
      { property: "og:title", content: "Add Milk Record | Smart Dairy Monitor" },
      { property: "og:description", content: "Daily milk entry with automatic total and baseline comparison." },
    ],
  }),
  component: AddMilk,
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";


function AddMilk() {
  const { data, addMilkRecord } = useDairy();
  const [form, setForm] = useState({
    date: todayISO(),
    cowId: "",
    morning: "",
    evening: "",
    feedKg: "",
    healthObservation: "Normal",
    notes: "",
  });
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const morning = Number(form.morning || 0);
  const evening = Number(form.evening || 0);
  const totalMilk = morning + evening;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cowId) return fail("Select a Cow ID. Add the cow first if it is missing.");
    if (!form.date) return fail("Date is required.");
    if (form.morning === "" && form.evening === "") return fail("Enter at least one milking quantity.");
    if (morning < 0 || evening < 0) return fail("Milk cannot be negative.");
    if (Number(form.feedKg || 0) < 0) return fail("Feed cannot be negative.");
    if (form.date > todayISO()) return fail("Date cannot be in the future.");

    const res = addMilkRecord({
      cowId: form.cowId,
      date: form.date,
      morning,
      evening,
      feedKg: Number(form.feedKg || 0),
      healthObservation: form.healthObservation,
      notes: form.notes.trim(),
    });
    if (!res.ok) return fail(res.error!);
    toast.success(`Saved ${fmt(totalMilk, 2)} L for ${form.cowId} on ${prettyDate(form.date)}.`);
    setLastSaved(form.cowId);
    setForm({ ...form, morning: "", evening: "", notes: "" });
  };

  const cmp = lastSaved ? compareCow(data, lastSaved) : null;

  return (
    <AppShell>
      <PageHeader title="Add Milk Record" subtitle="Total milk = morning + evening, calculated automatically. Saving a second record for the same cow and date updates it." />
      <DemoBanner />

      {data.cows.length === 0 ? (
        <Panel>
          <EmptyState title="No cows yet" body="A milk record must be linked to an existing Cow ID." />
          <div className="mt-4 text-center">
            <Link to="/cows" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Add a cow
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Panel title="Daily entry">
            <form onSubmit={submit} className="space-y-4">
              <Field label="Date">
                <input type="date" max={todayISO()} className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Cow ID">
                <select className={inputCls} value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })}>
                  <option value="">Select cow</option>
                  {data.cows.map((c) => (
                    <option key={c.id} value={c.cowId}>
                      {c.cowId} — {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Morning milk (L)">
                  <input type="number" min="0" step="0.1" className={inputCls} value={form.morning} onChange={(e) => setForm({ ...form, morning: e.target.value })} />
                </Field>
                <Field label="Evening milk (L)">
                  <input type="number" min="0" step="0.1" className={inputCls} value={form.evening} onChange={(e) => setForm({ ...form, evening: e.target.value })} />
                </Field>
              </div>
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                Total milk (calculated): <span className="font-display text-lg font-bold">{fmt(totalMilk, 2)} L</span>
              </div>
              <Field label="Feed quantity (kg)">
                <input type="number" min="0" step="0.1" className={inputCls} value={form.feedKg} onChange={(e) => setForm({ ...form, feedKg: e.target.value })} />
              </Field>
              <Field label="Health observation">
                <select className={inputCls} value={form.healthObservation} onChange={(e) => setForm({ ...form, healthObservation: e.target.value })}>
                  {["Normal", "Reduced appetite observed", "Reduced activity observed", "Needs attention", "Not recorded"].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notes">
                <textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Save record
              </button>
            </form>
          </Panel>

          <div className="space-y-6">
            {cmp ? (
              <Panel title={`Comparison for ${cmp.cowId}`} description="Each cow is compared against its own recent baseline.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Latest" value={`${fmt(cmp.current ?? 0, 2)} L`} />
                  <StatCard label="Baseline" value={cmp.baseline !== null ? `${fmt(cmp.baseline, 2)} L` : "-"} hint={`Previous ${cmp.baselineCount} records`} />
                  <StatCard
                    label="Change"
                    value={cmp.percentChange !== null ? `${cmp.percentChange > 0 ? "+" : ""}${cmp.percentChange.toFixed(1)}%` : "-"}
                    tone={cmp.alert ? "danger" : cmp.status === "up" ? "success" : "default"}
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <ComparisonBadge cmp={cmp} />
                  <Link to="/cows/$cowId" params={{ cowId: cmp.cowId }} className="text-sm font-semibold text-primary hover:underline">
                    Open cow profile
                  </Link>
                </div>
                {cmp.alert ? (
                  <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Unusual production decrease detected. Review recent recorded health, feed and management information.
                  </p>
                ) : null}
              </Panel>
            ) : (
              <Panel title="Comparison">
                <EmptyState title="Save a record to see the comparison" body="After saving, the app compares the new value with this cow's recent baseline." />
              </Panel>
            )}

            <Panel title="Recent records" description="Last 10 saved milk records">
              {data.milkRecords.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Cow</th>
                        <th className="py-2 pr-3">Total</th>
                        <th className="py-2 pr-3">Feed</th>
                        <th className="py-2">Observation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.milkRecords]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 10)
                        .map((r) => (
                          <tr key={r.id} className="border-b border-border/60 last:border-0">
                            <td className="py-2 pr-3">{prettyDate(r.date)}</td>
                            <td className="py-2 pr-3 font-semibold">{r.cowId}</td>
                            <td className="py-2 pr-3">{fmt(r.morning + r.evening, 2)} L</td>
                            <td className="py-2 pr-3">{fmt(r.feedKg)} kg</td>
                            <td className="py-2 text-muted-foreground">{r.healthObservation}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No records yet" body="Saved records appear here immediately." />
              )}
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

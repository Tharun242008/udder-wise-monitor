import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/dairy/AppShell";
import { EmptyState, Field, Panel, StatCard } from "@/components/dairy/ui";
const fail = (m: string): void => {
  toast.error(m);
};

import { useDairy } from "@/lib/dairy/store";
import { toCSV, total } from "@/lib/dairy/analytics";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Data | Smart Dairy Monitor" },
      {
        name: "description",
        content:
          "Configure the milk drop alert threshold, baseline window and schedule reminder days. Export or import farm records and manage demo data.",
      },
      { property: "og:title", content: "Settings & Data | Smart Dairy Monitor" },
      { property: "og:description", content: "Alert thresholds, baseline window, CSV and JSON export, import and demo data controls." },
    ],
  }),
  component: SettingsPage,
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn = "rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function SettingsPage() {
  const { data, updateSettings, loadDemoData, clearDemoData, clearAll, importData } = useDairy();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const hasDemo = data.cows.some((c) => c.isDemo) || data.milkRecords.some((r) => r.isDemo);

  const exportJSON = () =>
    download(`smart-dairy-monitor-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");

  const exportCSV = () => {
    if (!data.milkRecords.length) return fail("No milk records to export yet.");
    const rows = data.milkRecords
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        date: r.date,
        cowId: r.cowId,
        cowName: data.cows.find((c) => c.cowId === r.cowId)?.name ?? "",
        morningL: r.morning,
        eveningL: r.evening,
        totalL: total(r),
        feedKg: r.feedKg,
        healthObservation: r.healthObservation,
        notes: r.notes,
      }));
    download(`milk-records-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows), "text/csv");
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    const res = importData(text);
    if (!res.ok) return fail(res.error!);
    toast.success("Farm records imported. Existing data was replaced.");
  };

  return (
    <AppShell>
      <PageHeader title="Settings & Data" subtitle="Alert rules are transparent: you set them here and every page uses the same values." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cows" value={data.cows.length} />
        <StatCard label="Milk records" value={data.milkRecords.length} />
        <StatCard label="Health records" value={data.healthRecords.length} />
        <StatCard label="Treatments" value={data.injections.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Alert rules" description="Changes apply immediately across the dashboard, insights and alerts.">
          <div className="space-y-4">
            <Field label="Farm name">
              <input className={inputCls} value={s.farmName} onChange={(e) => updateSettings({ farmName: e.target.value })} />
            </Field>
            <Field label="Milk drop alert threshold (%)" hint="A cow is flagged when its latest total falls this far below its own baseline.">
              <input
                type="number"
                min="5"
                max="90"
                className={inputCls}
                value={s.milkDropThresholdPct}
                onChange={(e) => updateSettings({ milkDropThresholdPct: Math.min(90, Math.max(5, Number(e.target.value) || 20)) })}
              />
            </Field>
            <Field label="Baseline window (records)" hint="Number of previous records averaged to form the baseline (3 to 7).">
              <input
                type="number"
                min="3"
                max="7"
                className={inputCls}
                value={s.baselineWindow}
                onChange={(e) => updateSettings({ baselineWindow: Math.min(7, Math.max(3, Number(e.target.value) || 5)) })}
              />
            </Field>
            <Field label="Schedule reminder lead time (days)" hint="How many days before a due date a treatment shows as due soon.">
              <input
                type="number"
                min="1"
                max="30"
                className={inputCls}
                value={s.scheduleAlertLeadDays}
                onChange={(e) => updateSettings({ scheduleAlertLeadDays: Math.min(30, Math.max(1, Number(e.target.value) || 3)) })}
              />
            </Field>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Export" description="Take a full backup, or a spreadsheet of milk records.">
            <div className="flex flex-wrap gap-3">
              <button className={btn} onClick={exportJSON}>
                Export all data (JSON)
              </button>
              <button className={btn} onClick={exportCSV}>
                Export milk records (CSV)
              </button>
            </div>
          </Panel>

          <Panel title="Import" description="Importing replaces everything currently stored in this browser.">
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
                e.target.value = "";
              }}
            />
            <button className={btn} onClick={() => fileRef.current?.click()}>
              Choose a JSON backup file
            </button>
          </Panel>

          <Panel title="Demo data" description="Demo rows are tagged so they never get confused with real farm records.">
            <div className="flex flex-wrap gap-3">
              <button
                className={btn}
                onClick={() => {
                  loadDemoData();
                  toast.success("Demo herd loaded.");
                }}
              >
                Load demo data
              </button>
              <button
                className={btn}
                disabled={!hasDemo}
                onClick={() => {
                  clearDemoData();
                  toast.success("Demo rows removed. Your own records are untouched.");
                }}
              >
                Remove demo data
              </button>
            </div>
          </Panel>

          <Panel title="Danger zone">
            {confirmClear ? (
              <div className="space-y-3">
                <EmptyState title="Delete everything?" body="All cows, milk records, health records and treatment schedules stored in this browser will be permanently removed." />
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      clearAll();
                      setConfirmClear(false);
                      toast.success("All data deleted.");
                    }}
                  >
                    Yes, delete everything
                  </button>
                  <button className={btn} onClick={() => setConfirmClear(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className={btn} onClick={() => setConfirmClear(true)}>
                Clear all data
              </button>
            )}
          </Panel>
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Records are stored only in this browser. Export a JSON backup before clearing data or switching device. This application supports farm
        monitoring and does not provide veterinary diagnosis.
      </p>
    </AppShell>
  );
}

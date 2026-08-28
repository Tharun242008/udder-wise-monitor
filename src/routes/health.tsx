import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { EmptyState, Field, Panel, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import { prettyDate, todayISO } from "@/lib/dairy/analytics";
import type { HealthRecord } from "@/lib/dairy/types";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health Observations | Smart Dairy Monitor" },
      { name: "description", content: "Record appetite, activity and general observations per cow. Observations only — the app does not diagnose disease." },
      { property: "og:title", content: "Health Observations | Smart Dairy Monitor" },
      { property: "og:description", content: "Structured daily health observation records for each cow." },
    ],
  }),
  component: HealthPage;
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

const APPETITE: HealthRecord["appetite"][] = ["Normal", "Reduced", "Increased", "Not recorded"];
const ACTIVITY: HealthRecord["activity"][] = ["Normal", "Reduced", "Increased", "Not recorded"];
const GENERAL: HealthRecord["general"][] = ["Normal", "Needs attention", "Other"];

function HealthPage() {
  const { data, addHealthRecord, deleteHealthRecord } = useDairy();
  const [form, setForm] = useState({
    cowId: "",
    date: todayISO(),
    appetite: "Normal" as HealthRecord["appetite"],
    activity: "Normal" as HealthRecord["activity"],
    general: "Normal" as HealthRecord["general"],
    observation: "",
    notes: "",
  });
  const [filterCow, setFilterCow] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const records = data.healthRecords
    .filter((h) => (!filterCow || h.cowId === filterCow) && (!filterStatus || h.general === filterStatus))
    .sort((a, b) => b.date.localeCompare(a.date));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cowId) return toast.error("Select a Cow ID.");
    if (!form.date) return toast.error("Date is required.");
    if (form.date > todayISO()) return toast.error("Date cannot be in the future.");
    const res = addHealthRecord({ ...form, observation: form.observation.trim(), notes: form.notes.trim() });
    if (!res.ok) return toast.error(res.error!);
    toast.success(`Observation recorded for ${form.cowId}.`);
    setForm({ ...form, observation: "", notes: "" });
  };

  return (
    <AppShell>
      <PageHeader
        title="Health Records"
        subtitle="These entries are recorded observations only. The application does not diagnose diseases."
      />
      <DemoBanner />

      {data.cows.length === 0 ? (
        <Panel>
          <EmptyState title="No cows yet" body="Health observations are linked to an existing Cow ID." />
          <div className="mt-4 text-center">
            <Link to="/cows" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Add a cow
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Panel title="Add observation">
            <form onSubmit={submit} className="space-y-4">
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
              <Field label="Date">
                <input type="date" max={todayISO()} className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Appetite">
                <select className={inputCls} value={form.appetite} onChange={(e) => setForm({ ...form, appetite: e.target.value as HealthRecord["appetite"] })}>
                  {APPETITE.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Activity">
                <select className={inputCls} value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value as HealthRecord["activity"] })}>
                  {ACTIVITY.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="General observation">
                <select className={inputCls} value={form.general} onChange={(e) => setForm({ ...form, general: e.target.value as HealthRecord["general"] })}>
                  {GENERAL.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="What did you observe?" hint="Recorded observation — no diagnosis is made by the app.">
                <textarea rows={3} className={inputCls} value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} />
              </Field>
              <Field label="Notes">
                <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Save observation
              </button>
            </form>
          </Panel>

          <Panel
            title={`Recorded observations (${records.length})`}
            actions={
              <div className="flex flex-wrap gap-2">
                <select className={`${inputCls} sm:w-40`} value={filterCow} onChange={(e) => setFilterCow(e.target.value)}>
                  <option value="">All cows</option>
                  {data.cows.map((c) => (
                    <option key={c.id} value={c.cowId}>{c.cowId}</option>
                  ))}
                </select>
                <select className={`${inputCls} sm:w-44`} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All health status</option>
                  {GENERAL.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            }
          >
            {records.length ? (
              <ul className="space-y-4">
                {records.map((h) => (
                  <li key={h.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          <Link to="/cows/$cowId" params={{ cowId: h.cowId }} className="hover:underline">
                            {h.cowId}
                          </Link>{" "}
                          · {prettyDate(h.date)} {h.isDemo ? <Tag>Demo</Tag> : null}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Appetite: {h.appetite} · Activity: {h.activity} · General: {h.general}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {h.general === "Needs attention" ? (
                          <Tag tone="warning">Possible factor requiring further checking</Tag>
                        ) : (
                          <Tag tone="success">Recorded observation</Tag>
                        )}
                        <button
                          aria-label={`Delete observation for ${h.cowId}`}
                          onClick={() => {
                            deleteHealthRecord(h.id);
                            toast.success("Observation deleted.");
                          }}
                          className="rounded-md border border-input p-1.5 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {h.observation ? <p className="mt-2 text-sm">{h.observation}</p> : null}
                    {h.notes ? <p className="mt-1 text-xs text-muted-foreground">Notes: {h.notes}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No observations recorded" body="Use the form to record appetite, activity and general observations." />
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

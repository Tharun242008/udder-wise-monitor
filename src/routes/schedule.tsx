import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { EmptyState, Field, Panel, ScheduleBadge, StatCard, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import { addDaysISO, allSchedules, prettyDate, todayISO } from "@/lib/dairy/analytics";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Injection & Treatment Schedule | Smart Dairy Monitor" },
      { name: "description", content: "Record treatments with the given date and a farmer or veterinarian supplied interval, and get next due date, days since and days remaining." },
      { property: "og:title", content: "Injection & Treatment Schedule | Smart Dairy Monitor" },
      { property: "og:description", content: "Date calculations and reminders based on your own scheduling information." },
    ],
  }),
  component: SchedulePage,
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function SchedulePage() {
  const { data, addInjection, deleteInjection } = useDairy();
  const [mode, setMode] = useState<"interval" | "date">("interval");
  const [form, setForm] = useState({
    cowId: "",
    treatment: "",
    givenDate: todayISO(),
    intervalDays: "30",
    nextDueDate: "",
    notes: "",
  });
  const [filterCow, setFilterCow] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const schedules = allSchedules(data).filter(
    (s) => (!filterCow || s.record.cowId === filterCow) && (!filterStatus || s.status === filterStatus),
  );

  const preview =
    mode === "interval" && form.givenDate && Number(form.intervalDays) > 0
      ? addDaysISO(form.givenDate, Number(form.intervalDays))
      : mode === "date"
        ? form.nextDueDate || null
        : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cowId) return toast.error("Select a Cow ID.");
    if (!form.treatment.trim()) return toast.error("Injection/treatment name is required.");
    if (!form.givenDate) return toast.error("Given date is required.");
    if (mode === "interval" && !(Number(form.intervalDays) > 0))
      return toast.error("Interval must be greater than 0 days.");
    if (mode === "date" && !form.nextDueDate) return toast.error("Enter the next due date.");
    if (mode === "date" && form.nextDueDate < form.givenDate)
      return toast.error("Next due date cannot be earlier than the given date.");

    const res = addInjection({
      cowId: form.cowId,
      treatment: form.treatment.trim(),
      givenDate: form.givenDate,
      intervalDays: mode === "interval" ? Number(form.intervalDays) : null,
      nextDueDate: mode === "date" ? form.nextDueDate : null,
      notes: form.notes.trim(),
    });
    if (!res.ok) return toast.error(res.error!);
    toast.success(`Schedule saved for ${form.cowId}.`);
    setForm({ ...form, treatment: "", notes: "" });
  };

  const counts = {
    overdue: allSchedules(data).filter((s) => s.status === "overdue").length,
    today: allSchedules(data).filter((s) => s.status === "due-today").length,
    soon: allSchedules(data).filter((s) => s.status === "due-soon").length,
  };

  return (
    <AppShell>
      <PageHeader
        title="Health & Schedule"
        subtitle="The app only performs date calculations and reminders. The interval or next due date must be provided by you or your veterinarian."
      />
      <DemoBanner />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Overdue" value={counts.overdue} tone={counts.overdue ? "danger" : "default"} />
        <StatCard label="Due today" value={counts.today} tone={counts.today ? "danger" : "default"} />
        <StatCard label="Due soon" value={counts.soon} tone={counts.soon ? "warning" : "default"} hint={`Within ${data.settings.scheduleAlertLeadDays} days`} />
      </div>

      {data.cows.length === 0 ? (
        <Panel>
          <EmptyState title="No cows yet" body="Treatment records are linked to an existing Cow ID." />
          <div className="mt-4 text-center">
            <Link to="/cows" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Add a cow
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Panel title="Add injection / treatment">
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
              <Field label="Injection / treatment name">
                <input className={inputCls} value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
              </Field>
              <Field label="Given date">
                <input type="date" className={inputCls} value={form.givenDate} onChange={(e) => setForm({ ...form, givenDate: e.target.value })} />
              </Field>
              <Field label="Scheduling method" hint="Provided by the farmer or veterinarian — never decided by the app.">
                <div className="flex gap-2">
                  {(["interval", "date"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold ${
                        mode === m ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-accent"
                      }`}
                    >
                      {m === "interval" ? "Interval (days)" : "Next due date"}
                    </button>
                  ))}
                </div>
              </Field>
              {mode === "interval" ? (
                <Field label="Interval in days">
                  <input type="number" min="1" className={inputCls} value={form.intervalDays} onChange={(e) => setForm({ ...form, intervalDays: e.target.value })} />
                </Field>
              ) : (
                <Field label="Next due date">
                  <input type="date" min={form.givenDate} className={inputCls} value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
                </Field>
              )}
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                Calculated next due date: <span className="font-semibold">{preview ? prettyDate(preview) : "-"}</span>
              </div>
              <Field label="Notes">
                <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Save schedule
              </button>
            </form>
          </Panel>

          <Panel
            title={`Schedules (${schedules.length})`}
            actions={
              <div className="flex flex-wrap gap-2">
                <select className={`${inputCls} sm:w-36`} value={filterCow} onChange={(e) => setFilterCow(e.target.value)}>
                  <option value="">All cows</option>
                  {data.cows.map((c) => (
                    <option key={c.id} value={c.cowId}>{c.cowId}</option>
                  ))}
                </select>
                <select className={`${inputCls} sm:w-40`} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="overdue">Overdue</option>
                  <option value="due-today">Due today</option>
                  <option value="due-soon">Due soon</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            }
          >
            {schedules.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">Cow</th>
                      <th className="py-2 pr-3">Treatment</th>
                      <th className="py-2 pr-3">Given</th>
                      <th className="py-2 pr-3">Next due</th>
                      <th className="py-2 pr-3">Days since</th>
                      <th className="py-2 pr-3">Days remaining</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.record.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3 font-semibold">
                          <Link to="/cows/$cowId" params={{ cowId: s.record.cowId }} className="hover:underline">
                            {s.record.cowId}
                          </Link>{" "}
                          {s.record.isDemo ? <Tag>Demo</Tag> : null}
                        </td>
                        <td className="py-2 pr-3">{s.record.treatment}</td>
                        <td className="py-2 pr-3">{prettyDate(s.record.givenDate)}</td>
                        <td className="py-2 pr-3">{prettyDate(s.nextDue)}</td>
                        <td className="py-2 pr-3">{s.daysSinceGiven} days</td>
                        <td className="py-2 pr-3">{s.daysRemaining === null ? "-" : `${s.daysRemaining} days`}</td>
                        <td className="py-2 pr-3">
                          <ScheduleBadge info={s} />
                        </td>
                        <td className="py-2 text-right">
                          <button
                            aria-label={`Delete schedule for ${s.record.cowId}`}
                            onClick={() => {
                              deleteInjection(s.record.id);
                              toast.success("Schedule deleted.");
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
              <EmptyState title="No schedules" body="Add a treatment with an interval or a next due date to get reminders." />
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              The application does not advise whether a treatment should be given. It calculates dates from the information you enter.
            </p>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

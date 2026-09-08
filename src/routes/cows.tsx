import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell, DemoBanner, PageHeader } from "@/components/dairy/AppShell";
import { ComparisonBadge, EmptyState, Field, Panel, Tag } from "@/components/dairy/ui";
import { useDairy } from "@/lib/dairy/store";
import { compareCow, prettyDate, todayISO } from "@/lib/dairy/analytics";
import type { Cow } from "@/lib/dairy/types";

const fail = (m: string): void => {
  toast.error(m);
};

export const Route = createFileRoute("/cows")({
  head: () => ({
    meta: [
      { title: "Cow Management | Smart Dairy Monitor" },
      { name: "description", content: "Add, edit, search and delete cows, and open a full cow profile with milk and health history." },
      { property: "og:title", content: "Cow Management | Smart Dairy Monitor" },
      { property: "og:description", content: "Manage your herd records: cow ID, breed, age and notes." },
    ],
  }),
  component: CowsLayout,
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function CowsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/cows") return <Outlet />;
  return <CowsPage />;
}

const blank = { cowId: "", name: "", age: "", breed: "", dateAdded: todayISO(), notes: "" };

function CowsPage() {
  const { data, addCow, updateCow, deleteCow } = useDairy();
  const [form, setForm] = useState({ ...blank });
  const [editing, setEditing] = useState<Cow | null>(null);
  const [search, setSearch] = useState("");

  const filtered = data.cows.filter((c) =>
    `${c.cowId} ${c.name} ${c.breed}`.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cowId: form.cowId.trim().toUpperCase(),
      name: form.name.trim(),
      age: Number(form.age),
      breed: form.breed.trim(),
      dateAdded: form.dateAdded || todayISO(),
      notes: form.notes.trim(),
    };
    if (!payload.cowId) return fail("Cow ID is required (example: C001).");
    if (!payload.name) return fail("Cow name is required.");
    if (form.age === "" || Number.isNaN(payload.age) || payload.age < 0)
      return fail("Age must be a number of 0 or more.");
    const res = editing ? updateCow(editing.id, payload) : addCow(payload);
    if (!res.ok) return fail(res.error!);
    toast.success(editing ? `${payload.cowId} updated.` : `${payload.cowId} added.`);
    setForm({ ...blank });
    setEditing(null);
  };

  return (
    <AppShell>
      <PageHeader title="Cows" subtitle="Each cow needs a unique Cow ID. Milk, health and treatment records are linked to this ID." />
      <DemoBanner />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel
          title={`Herd (${data.cows.length})`}
          actions={
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cow ID, name, breed"
              className={`${inputCls} sm:w-64`}
            />
          }
        >
          {filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Cow ID</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Age</th>
                    <th className="py-2 pr-3">Breed</th>
                    <th className="py-2 pr-3">Added</th>
                    <th className="py-2 pr-3">Latest trend</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-semibold">
                        <Link to="/cows/$cowId" params={{ cowId: c.cowId }} className="hover:underline">
                          {c.cowId}
                        </Link>{" "}
                        {c.isDemo ? <Tag>Demo</Tag> : null}
                      </td>
                      <td className="py-2 pr-3">{c.name}</td>
                      <td className="py-2 pr-3">{c.age}</td>
                      <td className="py-2 pr-3">{c.breed || "-"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{prettyDate(c.dateAdded)}</td>
                      <td className="py-2 pr-3">
                        <ComparisonBadge cmp={compareCow(data, c.cowId)} />
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            aria-label={`Edit ${c.cowId}`}
                            onClick={() => {
                              setEditing(c);
                              setForm({
                                cowId: c.cowId,
                                name: c.name,
                                age: String(c.age),
                                breed: c.breed,
                                dateAdded: c.dateAdded,
                                notes: c.notes,
                              });
                            }}
                            className="rounded-md border border-input p-1.5 hover:bg-accent"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            aria-label={`Delete ${c.cowId}`}
                            onClick={() => {
                              if (confirm(`Delete ${c.cowId} and all of its records?`)) {
                                deleteCow(c.id);
                                toast.success(`${c.cowId} deleted.`);
                              }
                            }}
                            className="rounded-md border border-input p-1.5 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No cows found" body="Add your first cow using the form, or clear the search filter." />
          )}
        </Panel>

        <Panel title={editing ? `Edit ${editing.cowId}` : "Add cow"}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Cow ID" hint="Must be unique, e.g. C001">
              <input className={inputCls} value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} />
            </Field>
            <Field label="Cow name">
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Age (years)">
                <input type="number" min="0" step="0.5" className={inputCls} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </Field>
              <Field label="Breed">
                <input className={inputCls} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
              </Field>
            </div>
            <Field label="Date added">
              <input type="date" className={inputCls} value={form.dateAdded} onChange={(e) => setForm({ ...form, dateAdded: e.target.value })} />
            </Field>
            <Field label="Notes">
              <textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                {editing ? "Save changes" : "Add cow"}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...blank });
                  }}
                  className="rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}

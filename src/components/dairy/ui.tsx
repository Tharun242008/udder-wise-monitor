import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Comparison, ScheduleInfo } from "@/lib/dairy/analytics";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
  icon?: ReactNode;
}) {
  const toneRing = {
    default: "border-border",
    warning: "border-warning/50 bg-warning/5",
    danger: "border-destructive/50 bg-destructive/5",
    success: "border-success/50 bg-success/5",
  }[tone];
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm", toneRing)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className="font-display mt-2 text-3xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  actions,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Tag({ tone = "muted", children }: { tone?: "muted" | "success" | "warning" | "danger" | "info"; children: ReactNode }) {
  const cls = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success-foreground",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info-foreground",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>{children}</span>;
}

export function ComparisonBadge({ cmp }: { cmp: Comparison }) {
  if (!cmp.hasEnoughData) return <Tag tone="muted">🟡 Not enough historical data</Tag>;
  if (cmp.status === "down")
    return (
      <Tag tone={cmp.alert ? "danger" : "warning"}>
        🔴 Decreased by {Math.abs(cmp.percentChange!).toFixed(1)}%
      </Tag>
    );
  if (cmp.status === "up") return <Tag tone="success">🟢 Increased by {cmp.percentChange!.toFixed(1)}%</Tag>;
  return <Tag tone="warning">🟡 Stable</Tag>;
}

export function ScheduleBadge({ info }: { info: ScheduleInfo }) {
  const map: Record<ScheduleInfo["status"], { tone: "muted" | "success" | "warning" | "danger"; text: string }> = {
    scheduled: { tone: "success", text: `🟢 Scheduled — ${info.label}` },
    "due-soon": { tone: "warning", text: `🟡 ${info.label}` },
    "due-today": { tone: "danger", text: "🔴 Due today" },
    overdue: { tone: "danger", text: `🔴 ${info.label}` },
    "no-schedule": { tone: "muted", text: "No schedule entered" },
  };
  const v = map[info.status];
  return <Tag tone={v.tone}>{v.text}</Tag>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center">
      <p className="font-display font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

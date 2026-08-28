import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  MilkOff,
  Droplets,
  LineChart,
  Stethoscope,
  Syringe,
  BrainCircuit,
  Bell,
  Settings as SettingsIcon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDairy } from "@/lib/dairy/store";
import { allComparisons, allSchedules } from "@/lib/dairy/analytics";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cows", label: "Cows", icon: MilkOff },
  { to: "/milk/add", label: "Add Milk Record", icon: Droplets },
  { to: "/milk/history", label: "Milk History", icon: LineChart },
  { to: "/health", label: "Health Records", icon: Stethoscope },
  { to: "/schedule", label: "Injection Schedule", icon: Syringe },
  { to: "/insights", label: "AI Insights", icon: BrainCircuit },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function DemoBanner() {
  const { data } = useDairy();
  const hasDemo =
    data.cows.some((c) => c.isDemo) || data.milkRecords.some((r) => r.isDemo);
  if (!hasDemo) return null;
  return (
    <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-warning-foreground">
      DEMO DATA — Replace with actual farm records. Demo rows are marked with a “Demo” tag.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useDairy();
  const alertCount =
    allComparisons(data).filter((c) => c.alert).length +
    allSchedules(data).filter((s) => s.status === "overdue" || s.status === "due-today" || s.status === "due-soon").length;

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
        <span className="font-display font-bold text-sidebar-foreground">Smart Dairy Monitor</span>
        <button aria-label="Toggle navigation" onClick={() => setOpen((o) => !o)} className="text-sidebar-foreground">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <aside
        className={cn(
          "z-20 w-full shrink-0 border-border bg-sidebar lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r",
          open ? "block" : "hidden lg:block",
        )}
      >
        <div className="hidden px-5 py-6 lg:block">
          <p className="font-display text-lg font-bold leading-tight text-sidebar-foreground">
            Smart Dairy <span className="text-primary">Monitor</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Cow Health &amp; Milk Production</p>
        </div>
        <nav className="space-y-1 px-3 pb-6 pt-3 lg:pt-0">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {label === "Alerts" && alertCount > 0 ? (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                    {alertCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-5 pb-6 text-xs leading-relaxed text-muted-foreground lg:block">
          C29 AI Immersion Programme project. Anomaly detection: Isolation Forest (in-browser prototype).
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

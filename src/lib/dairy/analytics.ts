import type { DairyData, HealthRecord, InjectionRecord, MilkRecord, Settings } from "./types";

export const total = (r: MilkRecord) => r.morning + r.evening;

export const fmt = (n: number, d = 1) => Number.isFinite(n) ? n.toFixed(d) : "-";

export function parseDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, day ?? 1);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseDate(fromISO).getTime();
  const b = parseDate(toISO).getTime();
  return Math.round((b - a) / 86400000);
}

export function prettyDate(iso: string | null): string {
  if (!iso) return "-";
  const d = parseDate(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function cowRecords(data: DairyData, cowId: string): MilkRecord[] {
  return data.milkRecords
    .filter((r) => r.cowId === cowId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type Comparison = {
  cowId: string;
  hasEnoughData: boolean;
  current: number | null;
  currentDate: string | null;
  baseline: number | null;
  baselineCount: number;
  absoluteChange: number | null;
  percentChange: number | null;
  status: "up" | "down" | "stable" | "insufficient";
  alert: boolean;
  message: string;
};

/**
 * Smart baseline: mean of the previous `baselineWindow` (3-7) valid records
 * BEFORE the latest record for the same cow. Falls back to the single
 * previous record when only one prior record exists.
 */
export function compareCow(data: DairyData, cowId: string): Comparison {
  const settings = data.settings;
  const recs = cowRecords(data, cowId).filter((r) => total(r) >= 0);
  const base: Comparison = {
    cowId,
    hasEnoughData: false,
    current: null,
    currentDate: null,
    baseline: null,
    baselineCount: 0,
    absoluteChange: null,
    percentChange: null,
    status: "insufficient",
    alert: false,
    message: "Not enough historical data for reliable comparison.",
  };
  if (recs.length < 2) {
    if (recs.length === 1) {
      base.current = total(recs[0]!);
      base.currentDate = recs[0]!.date;
    }
    return base;
  }
  const latest = recs[recs.length - 1]!;
  const window = Math.min(Math.max(settings.baselineWindow, 3), 7);
  const prior = recs.slice(Math.max(0, recs.length - 1 - window), recs.length - 1);
  const baseline = prior.reduce((s, r) => s + total(r), 0) / prior.length;
  const current = total(latest);
  const abs = current - baseline;
  const pct = baseline > 0 ? (abs / baseline) * 100 : 0;
  let status: Comparison["status"] = "stable";
  if (pct <= -5) status = "down";
  else if (pct >= 5) status = "up";
  const alert = pct <= -settings.milkDropThresholdPct;
  const message =
    status === "down"
      ? `Milk production decreased by ${Math.abs(pct).toFixed(1)}%`
      : status === "up"
        ? `Milk production increased by ${pct.toFixed(1)}%`
        : "Milk production is stable";
  return {
    cowId,
    hasEnoughData: true,
    current,
    currentDate: latest.date,
    baseline,
    baselineCount: prior.length,
    absoluteChange: abs,
    percentChange: pct,
    status,
    alert,
    message,
  };
}

export function allComparisons(data: DairyData): Comparison[] {
  return data.cows.map((c) => compareCow(data, c.cowId));
}

export type ScheduleInfo = {
  record: InjectionRecord;
  nextDue: string | null;
  daysSinceGiven: number;
  daysRemaining: number | null;
  status: "scheduled" | "due-soon" | "due-today" | "overdue" | "no-schedule";
  label: string;
};

export function scheduleInfo(rec: InjectionRecord, settings: Settings, today = todayISO()): ScheduleInfo {
  const nextDue = rec.nextDueDate ?? (rec.intervalDays ? addDaysISO(rec.givenDate, rec.intervalDays) : null);
  const daysSinceGiven = daysBetween(rec.givenDate, today);
  if (!nextDue) {
    return { record: rec, nextDue: null, daysSinceGiven, daysRemaining: null, status: "no-schedule", label: "No schedule entered" };
  }
  const daysRemaining = daysBetween(today, nextDue);
  let status: ScheduleInfo["status"] = "scheduled";
  let label = `Due in ${daysRemaining} days`;
  if (daysRemaining < 0) {
    status = "overdue";
    label = `Schedule overdue by ${Math.abs(daysRemaining)} days`;
  } else if (daysRemaining === 0) {
    status = "due-today";
    label = "Due today";
  } else if (daysRemaining <= settings.scheduleAlertLeadDays) {
    status = "due-soon";
    label = `Due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
  }
  return { record: rec, nextDue, daysSinceGiven, daysRemaining, status, label };
}

export function allSchedules(data: DairyData): ScheduleInfo[] {
  return data.injections
    .map((r) => scheduleInfo(r, data.settings))
    .sort((a, b) => (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999));
}

export function dailyTotals(data: DairyData): { date: string; litres: number; feed: number }[] {
  const map = new Map<string, { litres: number; feed: number }>();
  for (const r of data.milkRecords) {
    const cur = map.get(r.date) ?? { litres: 0, feed: 0 };
    cur.litres += total(r);
    cur.feed += r.feedKg;
    map.set(r.date, cur);
  }
  return [...map.entries()]
    .map(([date, v]) => ({ date, litres: Number(v.litres.toFixed(2)), feed: Number(v.feed.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function latestDateWithRecords(data: DairyData): string | null {
  const dates = data.milkRecords.map((r) => r.date).sort();
  return dates.length ? (dates[dates.length - 1] ?? null) : null;
}

export function todayTotals(data: DairyData) {
  const today = todayISO();
  const recs = data.milkRecords.filter((r) => r.date === today);
  const usedDate = recs.length ? today : latestDateWithRecords(data);
  const used = usedDate ? data.milkRecords.filter((r) => r.date === usedDate) : [];
  const litres = used.reduce((s, r) => s + total(r), 0);
  return {
    date: usedDate,
    isToday: usedDate === today,
    litres,
    perCow: used.length ? litres / used.length : 0,
    cowsRecorded: used.length,
  };
}

/* ---------------- Anomaly detection: simplified Isolation Forest ---------------- */

type Tree = { value?: number; size?: number; split?: number; feature?: number; left?: Tree; right?: Tree; depth: number };

function buildTree(points: number[][], depth: number, maxDepth: number, rng: () => number): Tree {
  if (depth >= maxDepth || points.length <= 1) {
    return { size: points.length, depth };
  }
  const dims = points[0]!.length;
  const feature = Math.floor(rng() * dims);
  const values = points.map((p) => p[feature] ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return { size: points.length, depth };
  const split = min + rng() * (max - min);
  return {
    depth,
    feature,
    split,
    left: buildTree(points.filter((p) => (p[feature] ?? 0) < split), depth + 1, maxDepth, rng),
    right: buildTree(points.filter((p) => (p[feature] ?? 0) >= split), depth + 1, maxDepth, rng),
  };
}

function c(n: number) {
  if (n <= 1) return 1;
  return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n;
}

function pathLength(tree: Tree, point: number[], depth = 0): number {
  if (tree.feature === undefined || !tree.left || !tree.right) {
    return depth + c(tree.size ?? 1);
  }
  return (point[tree.feature] ?? 0) < tree.split! ? pathLength(tree.left, point, depth + 1) : pathLength(tree.right, point, depth + 1);
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type AnomalyPoint = {
  cowId: string;
  date: string;
  litres: number;
  feedKg: number;
  deltaFromPrev: number;
  score: number; // 0..1, higher = more anomalous
  isAnomaly: boolean;
};

/**
 * Transparent in-browser Isolation Forest prototype (100 trees, sub-sample 64).
 * Features: total litres, feed kg, change vs previous record for the same cow.
 * Limitation: trained on the same small stored dataset it scores; no accuracy
 * metric is claimed.
 */
export function isolationForest(data: DairyData, nTrees = 100): { points: AnomalyPoint[]; enoughData: boolean } {
  const rows: AnomalyPoint[] = [];
  for (const cow of data.cows) {
    const recs = cowRecords(data, cow.cowId);
    recs.forEach((r, i) => {
      const prev = i > 0 ? total(recs[i - 1]!) : total(r);
      rows.push({
        cowId: cow.cowId,
        date: r.date,
        litres: total(r),
        feedKg: r.feedKg,
        deltaFromPrev: Number((total(r) - prev).toFixed(2)),
        score: 0,
        isAnomaly: false,
      });
    });
  }
  if (rows.length < 20) return { points: rows, enoughData: false };

  const points = rows.map((r) => [r.litres, r.feedKg, r.deltaFromPrev]);
  const rng = mulberry32(42);
  const sampleSize = Math.min(64, points.length);
  const maxDepth = Math.ceil(Math.log2(Math.max(2, sampleSize)));
  const trees: Tree[] = [];
  for (let t = 0; t < nTrees; t++) {
    const sample: number[][] = [];
    for (let i = 0; i < sampleSize; i++) sample.push(points[Math.floor(rng() * points.length)]!);
    trees.push(buildTree(sample, 0, maxDepth, rng));
  }
  const cn = c(sampleSize);
  const scores = points.map((p) => {
    const avg = trees.reduce((s, t) => s + pathLength(t, p), 0) / trees.length;
    return Math.pow(2, -avg / cn);
  });
  const sorted = [...scores].sort((a, b) => b - a);
  const cutoff = sorted[Math.max(0, Math.floor(sorted.length * 0.08) - 1)] ?? 1;
  rows.forEach((r, i) => {
    r.score = Number((scores[i] ?? 0).toFixed(3));
    r.isAnomaly = (scores[i] ?? 0) >= cutoff;
  });
  return { points: rows, enoughData: true };
}

export type Insight = {
  cowId: string;
  comparison: Comparison;
  factors: string[];
  anomalyCount: number;
  summary: string;
};

export function buildInsights(data: DairyData): Insight[] {
  const { points, enoughData } = isolationForest(data);
  return data.cows.map((cow) => {
    const cmp = compareCow(data, cow.cowId);
    const recs = cowRecords(data, cow.cowId);
    const factors: string[] = [];

    if (recs.length >= 2) {
      const last = recs[recs.length - 1]!;
      const prev = recs[recs.length - 2]!;
      if (Math.abs(last.feedKg - prev.feedKg) >= 0.5) {
        factors.push(
          `Feed quantity changed from ${fmt(prev.feedKg)} kg to ${fmt(last.feedKg)} kg on the most recent record.`,
        );
      }
      if (last.healthObservation && last.healthObservation !== prev.healthObservation) {
        factors.push(`Recorded health observation changed to "${last.healthObservation}".`);
      }
    }

    const health = data.healthRecords
      .filter((h) => h.cowId === cow.cowId)
      .sort((a, b) => a.date.localeCompare(b.date));
    const lastHealth: HealthRecord | undefined = health[health.length - 1];
    if (lastHealth) {
      if (lastHealth.appetite !== "Normal" && lastHealth.appetite !== "Not recorded")
        factors.push(`Appetite recorded as ${lastHealth.appetite} on ${prettyDate(lastHealth.date)}.`);
      if (lastHealth.activity !== "Normal" && lastHealth.activity !== "Not recorded")
        factors.push(`Activity recorded as ${lastHealth.activity} on ${prettyDate(lastHealth.date)}.`);
      if (lastHealth.general === "Needs attention")
        factors.push(`General observation recorded as "Needs attention" on ${prettyDate(lastHealth.date)}.`);
    }

    const recentInjection = data.injections
      .filter((i) => i.cowId === cow.cowId)
      .sort((a, b) => a.givenDate.localeCompare(b.givenDate))
      .pop();
    if (recentInjection && cmp.currentDate) {
      const gap = daysBetween(recentInjection.givenDate, cmp.currentDate);
      if (gap >= 0 && gap <= 7)
        factors.push(
          `Treatment "${recentInjection.treatment}" was recorded ${gap} day(s) before the latest milk record.`,
        );
    }

    const anomalyCount = enoughData
      ? points.filter((p) => p.cowId === cow.cowId && p.isAnomaly).length
      : 0;

    let summary: string;
    if (!cmp.hasEnoughData) {
      summary = "Insufficient recorded data to identify meaningful contributing factors.";
    } else if (cmp.status === "down" && cmp.alert) {
      summary =
        "Milk production has decreased significantly compared with the recent baseline." +
        (factors.length
          ? " The recorded feed and health information have also changed. These are possible contributing factors that should be checked by the farmer."
          : " No related feed or health changes are recorded. Review recent recorded health, feed and management information.");
    } else if (cmp.status === "down") {
      summary = "A mild decrease is recorded compared with the recent baseline. Continue monitoring.";
    } else if (cmp.status === "up") {
      summary = "Production is above the recent baseline based on the stored records.";
    } else {
      summary = "Production is stable compared with the recent baseline.";
    }
    return { cowId: cow.cowId, comparison: cmp, factors, anomalyCount, summary };
  });
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

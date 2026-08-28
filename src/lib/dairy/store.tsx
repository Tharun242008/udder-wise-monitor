import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EMPTY_DATA, DEFAULT_SETTINGS, type Cow, type DairyData, type HealthRecord, type InjectionRecord, type MilkRecord, type Settings } from "./types";
import { generateDemoData } from "./demo";

const KEY = "smart-dairy-monitor:v1";

function load(): DairyData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as Partial<DairyData>;
    return {
      cows: parsed.cows ?? [],
      milkRecords: parsed.milkRecords ?? [],
      healthRecords: parsed.healthRecords ?? [],
      injections: parsed.injections ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return EMPTY_DATA;
  }
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

type Ctx = {
  data: DairyData;
  hydrated: boolean;
  addCow: (c: Omit<Cow, "id">) => { ok: boolean; error?: string };
  updateCow: (id: string, c: Partial<Cow>) => { ok: boolean; error?: string };
  deleteCow: (id: string) => void;
  addMilkRecord: (r: Omit<MilkRecord, "id">) => { ok: boolean; error?: string };
  deleteMilkRecord: (id: string) => void;
  addHealthRecord: (r: Omit<HealthRecord, "id">) => { ok: boolean; error?: string };
  deleteHealthRecord: (id: string) => void;
  addInjection: (r: Omit<InjectionRecord, "id">) => { ok: boolean; error?: string };
  deleteInjection: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  loadDemoData: () => void;
  clearDemoData: () => void;
  clearAll: () => void;
  importData: (json: string) => { ok: boolean; error?: string };
};

const DairyContext = createContext<Ctx | null>(null);

export function DairyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DairyData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable */
    }
  }, [data, hydrated]);

  const addCow = useCallback<Ctx["addCow"]>((cow) => {
    const cowId = cow.cowId.trim().toUpperCase();
    if (!cowId) return { ok: false, error: "Cow ID is required." };
    if (!cow.name.trim()) return { ok: false, error: "Cow name is required." };
    if (cow.age < 0 || Number.isNaN(cow.age)) return { ok: false, error: "Age must be 0 or more." };
    let dup = false;
    setData((d) => {
      if (d.cows.some((c) => c.cowId.toUpperCase() === cowId)) {
        dup = true;
        return d;
      }
      return { ...d, cows: [...d.cows, { ...cow, cowId, id: uid() }] };
    });
    return dup ? { ok: false, error: `Cow ID ${cowId} already exists.` } : { ok: true };
  }, []);

  const updateCow = useCallback<Ctx["updateCow"]>((id, patch) => {
    let error: string | undefined;
    setData((d) => {
      const existing = d.cows.find((c) => c.id === id);
      if (!existing) {
        error = "Cow not found.";
        return d;
      }
      const newCowId = (patch.cowId ?? existing.cowId).trim().toUpperCase();
      if (!newCowId) {
        error = "Cow ID is required.";
        return d;
      }
      if (d.cows.some((c) => c.id !== id && c.cowId.toUpperCase() === newCowId)) {
        error = `Cow ID ${newCowId} already exists.`;
        return d;
      }
      const renamed = newCowId !== existing.cowId;
      return {
        ...d,
        cows: d.cows.map((c) => (c.id === id ? { ...c, ...patch, cowId: newCowId } : c)),
        milkRecords: renamed
          ? d.milkRecords.map((r) => (r.cowId === existing.cowId ? { ...r, cowId: newCowId } : r))
          : d.milkRecords,
        healthRecords: renamed
          ? d.healthRecords.map((r) => (r.cowId === existing.cowId ? { ...r, cowId: newCowId } : r))
          : d.healthRecords,
        injections: renamed
          ? d.injections.map((r) => (r.cowId === existing.cowId ? { ...r, cowId: newCowId } : r))
          : d.injections,
      };
    });
    return error ? { ok: false, error } : { ok: true };
  }, []);

  const deleteCow = useCallback((id: string) => {
    setData((d) => {
      const cow = d.cows.find((c) => c.id === id);
      if (!cow) return d;
      return {
        ...d,
        cows: d.cows.filter((c) => c.id !== id),
        milkRecords: d.milkRecords.filter((r) => r.cowId !== cow.cowId),
        healthRecords: d.healthRecords.filter((r) => r.cowId !== cow.cowId),
        injections: d.injections.filter((r) => r.cowId !== cow.cowId),
      };
    });
  }, []);

  const addMilkRecord = useCallback<Ctx["addMilkRecord"]>((rec) => {
    let error: string | undefined;
    setData((d) => {
      if (!d.cows.some((c) => c.cowId === rec.cowId)) {
        error = "Cow ID does not exist. Add the cow first.";
        return d;
      }
      if (!rec.date) {
        error = "Date is required.";
        return d;
      }
      if (rec.morning < 0 || rec.evening < 0) {
        error = "Milk quantity cannot be negative.";
        return d;
      }
      if (rec.feedKg < 0) {
        error = "Feed quantity cannot be negative.";
        return d;
      }
      const existing = d.milkRecords.find((r) => r.cowId === rec.cowId && r.date === rec.date);
      const next = { ...rec, id: existing?.id ?? uid() };
      return {
        ...d,
        milkRecords: existing
          ? d.milkRecords.map((r) => (r.id === existing.id ? next : r))
          : [...d.milkRecords, next],
      };
    });
    return error ? { ok: false, error } : { ok: true };
  }, []);

  const deleteMilkRecord = useCallback((id: string) => {
    setData((d) => ({ ...d, milkRecords: d.milkRecords.filter((r) => r.id !== id) }));
  }, []);

  const addHealthRecord = useCallback<Ctx["addHealthRecord"]>((rec) => {
    let error: string | undefined;
    setData((d) => {
      if (!d.cows.some((c) => c.cowId === rec.cowId)) {
        error = "Cow ID does not exist.";
        return d;
      }
      if (!rec.date) {
        error = "Date is required.";
        return d;
      }
      return { ...d, healthRecords: [...d.healthRecords, { ...rec, id: uid() }] };
    });
    return error ? { ok: false, error } : { ok: true };
  }, []);

  const deleteHealthRecord = useCallback((id: string) => {
    setData((d) => ({ ...d, healthRecords: d.healthRecords.filter((r) => r.id !== id) }));
  }, []);

  const addInjection = useCallback<Ctx["addInjection"]>((rec) => {
    let error: string | undefined;
    setData((d) => {
      if (!d.cows.some((c) => c.cowId === rec.cowId)) {
        error = "Cow ID does not exist.";
        return d;
      }
      if (!rec.treatment.trim()) {
        error = "Treatment/injection name is required.";
        return d;
      }
      if (!rec.givenDate) {
        error = "Given date is required.";
        return d;
      }
      if (!rec.intervalDays && !rec.nextDueDate) {
        error = "Enter either an interval in days or a next due date.";
        return d;
      }
      if (rec.intervalDays !== null && rec.intervalDays <= 0) {
        error = "Interval must be greater than 0 days.";
        return d;
      }
      if (rec.nextDueDate && rec.nextDueDate < rec.givenDate) {
        error = "Next due date cannot be earlier than the given date.";
        return d;
      }
      return { ...d, injections: [...d.injections, { ...rec, id: uid() }] };
    });
    return error ? { ok: false, error } : { ok: true };
  }, []);

  const deleteInjection = useCallback((id: string) => {
    setData((d) => ({ ...d, injections: d.injections.filter((r) => r.id !== id) }));
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...s } }));
  }, []);

  const loadDemoData = useCallback(() => {
    setData((d) => {
      const demo = generateDemoData();
      return {
        cows: [...d.cows.filter((c) => !c.isDemo), ...demo.cows],
        milkRecords: [...d.milkRecords.filter((r) => !r.isDemo), ...demo.milkRecords],
        healthRecords: [...d.healthRecords.filter((r) => !r.isDemo), ...demo.healthRecords],
        injections: [...d.injections.filter((r) => !r.isDemo), ...demo.injections],
        settings: d.settings,
      };
    });
  }, []);

  const clearDemoData = useCallback(() => {
    setData((d) => ({
      cows: d.cows.filter((c) => !c.isDemo),
      milkRecords: d.milkRecords.filter((r) => !r.isDemo),
      healthRecords: d.healthRecords.filter((r) => !r.isDemo),
      injections: d.injections.filter((r) => !r.isDemo),
      settings: d.settings,
    }));
  }, []);

  const clearAll = useCallback(() => setData({ ...EMPTY_DATA, settings: DEFAULT_SETTINGS }), []);

  const importData = useCallback<Ctx["importData"]>((json) => {
    try {
      const parsed = JSON.parse(json) as Partial<DairyData>;
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.cows)) {
        return { ok: false, error: "Invalid file: expected an exported Smart Dairy Monitor JSON file." };
      }
      setData({
        cows: parsed.cows ?? [],
        milkRecords: parsed.milkRecords ?? [],
        healthRecords: parsed.healthRecords ?? [],
        injections: parsed.injections ?? [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not read the file as JSON." };
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      hydrated,
      addCow,
      updateCow,
      deleteCow,
      addMilkRecord,
      deleteMilkRecord,
      addHealthRecord,
      deleteHealthRecord,
      addInjection,
      deleteInjection,
      updateSettings,
      loadDemoData,
      clearDemoData,
      clearAll,
      importData,
    }),
    [data, hydrated, addCow, updateCow, deleteCow, addMilkRecord, deleteMilkRecord, addHealthRecord, deleteHealthRecord, addInjection, deleteInjection, updateSettings, loadDemoData, clearDemoData, clearAll, importData],
  );

  return <DairyContext.Provider value={value}>{children}</DairyContext.Provider>;
}

export function useDairy() {
  const ctx = useContext(DairyContext);
  if (!ctx) throw new Error("useDairy must be used inside DairyProvider");
  return ctx;
}

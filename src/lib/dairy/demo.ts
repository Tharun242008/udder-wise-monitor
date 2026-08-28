import { addDaysISO, todayISO } from "./analytics";
import { DEFAULT_SETTINGS, type DairyData } from "./types";

const BREEDS = ["Jersey", "Holstein Friesian", "Gir", "Sahiwal", "Crossbred HF", "Kangayam"];
const NAMES = [
  "Lakshmi", "Kamatchi", "Ponni", "Malar", "Thangam", "Selvi",
  "Vani", "Rani", "Kani", "Mullai", "Nila", "Amudha",
];

function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * DEMO DATA generator. Every record is flagged isDemo: true.
 * Farm scale matches the actual field observation: 12 cows, ~40 L/day total.
 */
export function generateDemoData(): DairyData {
  const r = rng(7);
  const today = todayISO();
  const cows = NAMES.map((name, i) => ({
    id: `demo-cow-${i + 1}`,
    cowId: `C${String(i + 1).padStart(3, "0")}`,
    name,
    age: 3 + Math.floor(r() * 6),
    breed: BREEDS[i % BREEDS.length],
    dateAdded: addDaysISO(today, -(120 + i * 5)),
    notes: "DEMO DATA — replace with actual farm records.",
    isDemo: true,
  }));

  const milkRecords: DairyData["milkRecords"] = [];
  const healthRecords: DairyData["healthRecords"] = [];

  cows.forEach((cow, ci) => {
    // per-cow average so herd total is close to 40 L/day
    const avg = 2.6 + r() * 1.6;
    for (let d = 20; d >= 0; d--) {
      const date = addDaysISO(today, -d);
      let dayAvg = avg + (r() - 0.5) * 0.4;
      let feed = 4 + Math.round(r() * 2 * 10) / 10;
      let obs = "Normal";
      // C005 demonstrates a significant decrease over the last 3 days (~30%)
      if (cow.cowId === "C005" && d <= 2) {
        dayAvg = avg * 0.7;
        feed = feed + 1.5;
        obs = "Reduced appetite observed";
      }
      const totalL = Math.max(0, Number(dayAvg.toFixed(2)));
      const morning = Number((totalL * 0.55).toFixed(2));
      const evening = Number((totalL - morning).toFixed(2));
      milkRecords.push({
        id: `demo-milk-${cow.cowId}-${date}`,
        cowId: cow.cowId,
        date,
        morning,
        evening,
        feedKg: feed,
        healthObservation: obs,
        notes: d === 0 ? "DEMO DATA" : "",
        isDemo: true,
      });
    }
    if (ci % 3 === 0 || cow.cowId === "C005") {
      const needsAttention = cow.cowId === "C005";
      healthRecords.push({
        id: `demo-health-${cow.cowId}`,
        cowId: cow.cowId,
        date: addDaysISO(today, needsAttention ? -1 : -4),
        appetite: needsAttention ? "Reduced" : "Normal",
        activity: needsAttention ? "Reduced" : "Normal",
        general: needsAttention ? "Needs attention" : "Normal",
        observation: needsAttention
          ? "Standing away from herd during evening milking (recorded observation)."
          : "Routine check, nothing unusual recorded.",
        notes: "DEMO DATA",
        isDemo: true,
      });
    }
  });

  const injections: DairyData["injections"] = [
    {
      id: "demo-inj-1",
      cowId: "C003",
      treatment: "Deworming (farmer/vet scheduled)",
      givenDate: addDaysISO(today, -27),
      intervalDays: 30,
      nextDueDate: null,
      notes: "DEMO DATA — interval provided by farmer/vet.",
      isDemo: true,
    },
    {
      id: "demo-inj-2",
      cowId: "C005",
      treatment: "Mineral supplement injection",
      givenDate: addDaysISO(today, -5),
      intervalDays: 30,
      nextDueDate: null,
      notes: "DEMO DATA",
      isDemo: true,
    },
    {
      id: "demo-inj-3",
      cowId: "C008",
      treatment: "FMD vaccination (as advised)",
      givenDate: addDaysISO(today, -95),
      intervalDays: 90,
      nextDueDate: null,
      notes: "DEMO DATA — overdue example.",
      isDemo: true,
    },
    {
      id: "demo-inj-4",
      cowId: "C001",
      treatment: "Routine treatment",
      givenDate: addDaysISO(today, -10),
      intervalDays: null,
      nextDueDate: addDaysISO(today, 10),
      notes: "DEMO DATA — manually entered due date.",
      isDemo: true,
    },
  ];

  return { cows, milkRecords, healthRecords, injections, settings: DEFAULT_SETTINGS };
}

export type Cow = {
  id: string; // internal uuid
  cowId: string; // C001
  name: string;
  age: number;
  breed: string;
  dateAdded: string; // yyyy-mm-dd
  notes: string;
  isDemo?: boolean;
};

export type MilkRecord = {
  id: string;
  cowId: string; // C001
  date: string; // yyyy-mm-dd
  morning: number;
  evening: number;
  feedKg: number;
  healthObservation: string;
  notes: string;
  isDemo?: boolean;
};

export type HealthRecord = {
  id: string;
  cowId: string;
  date: string;
  appetite: "Normal" | "Reduced" | "Increased" | "Not recorded";
  activity: "Normal" | "Reduced" | "Increased" | "Not recorded";
  general: "Normal" | "Needs attention" | "Other";
  observation: string;
  notes: string;
  isDemo?: boolean;
};

export type InjectionRecord = {
  id: string;
  cowId: string;
  treatment: string;
  givenDate: string;
  intervalDays: number | null;
  nextDueDate: string | null; // manually entered
  notes: string;
  isDemo?: boolean;
};

export type Settings = {
  milkDropThresholdPct: number; // default 20
  scheduleAlertLeadDays: number; // default 3
  baselineWindow: number; // 3-7
  farmName: string;
};

export type DairyData = {
  cows: Cow[];
  milkRecords: MilkRecord[];
  healthRecords: HealthRecord[];
  injections: InjectionRecord[];
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  milkDropThresholdPct: 20,
  scheduleAlertLeadDays: 3,
  baselineWindow: 5,
  farmName: "Smart Dairy Monitor Farm",
};

export const EMPTY_DATA: DairyData = {
  cows: [],
  milkRecords: [],
  healthRecords: [],
  injections: [],
  settings: DEFAULT_SETTINGS,
};

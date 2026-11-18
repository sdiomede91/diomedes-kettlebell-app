import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Level } from '@/data/exercises';
import { DEFAULT_ROTATION } from '@/engine/rotation';
import type { DayType, Rotation, SessionLength, TrainingDayType, Workout } from '@/engine/types';

export type WeightUnit = 'kg' | 'lb';

export type LogEntry = {
  exerciseId: string;
  weight?: number;
  reps?: string;
};

export type SessionLog = {
  id: string;
  dateKey: string;
  dayType: TrainingDayType;
  scheduled: DayType;
  flexed: boolean;
  completedAt: number;
  durationSec: number;
  entries: LogEntry[];
  amrapRounds?: number;
  note?: string;
};

export type Settings = {
  rotation: Rotation;
  minutes: SessionLength;
  maxLevel: Level;
  unit: WeightUnit;
  bells: number[];
  sound: boolean;
  haptics: boolean;
  reminder: { enabled: boolean; hour: number; minute: number };
};

export const DEFAULT_SETTINGS: Settings = {
  rotation: DEFAULT_ROTATION,
  minutes: 30,
  maxLevel: 'intermediate',
  unit: 'kg',
  bells: [12, 16, 20, 24],
  sound: true,
  haptics: true,
  reminder: { enabled: false, hour: 6, minute: 0 },
};

type State = {
  settings: Settings;
  flexOverrides: Record<string, DayType>;
  shuffles: Record<string, number>;
  sessions: SessionLog[];

  updateSettings: (patch: Partial<Settings>) => void;
  setFlex: (dateKey: string, day: DayType | null) => void;
  reshuffle: (dateKey: string) => void;
  logSession: (log: SessionLog) => void;
  deleteSession: (id: string) => void;
  importData: (data: ExportShape) => void;
  resetAll: () => void;
};

export type ExportShape = {
  app: 'diomedes';
  version: 1;
  exportedAt: string;
  settings: Settings;
  flexOverrides: Record<string, DayType>;
  sessions: SessionLog[];
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      flexOverrides: {},
      shuffles: {},
      sessions: [],

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setFlex: (dateKey, day) =>
        set((s) => {
          const next = { ...s.flexOverrides };
          if (day === null) delete next[dateKey];
          else next[dateKey] = day;
          return { flexOverrides: next };
        }),
      reshuffle: (dateKey) => set((s) => ({ shuffles: { ...s.shuffles, [dateKey]: (s.shuffles[dateKey] ?? 0) + 1 } })),
      logSession: (log) => set((s) => ({ sessions: [log, ...s.sessions] })),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      importData: (data) =>
        set(() => ({
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          flexOverrides: data.flexOverrides ?? {},
          sessions: data.sessions ?? [],
        })),
      resetAll: () => set(() => ({ settings: DEFAULT_SETTINGS, flexOverrides: {}, shuffles: {}, sessions: [] })),
    }),
    {
      name: 'diomedes-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

export function exportData(): ExportShape {
  const s = useStore.getState();
  return {
    app: 'diomedes',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: s.settings,
    flexOverrides: s.flexOverrides,
    sessions: s.sessions,
  };
}

/** Most recent weight logged for an exercise. */
export function lastWeight(sessions: SessionLog[], exerciseId: string): number | undefined {
  for (const s of sessions) {
    const e = s.entries.find((x) => x.exerciseId === exerciseId && x.weight !== undefined);
    if (e) return e.weight;
  }
  return undefined;
}

/** In-memory (non-persisted) handoff of the workout being trained right now. */
type ActiveState = {
  workout: Workout | null;
  meta: { scheduled: DayType; flexed: boolean } | null;
  result: { durationSec: number } | null;
  begin: (w: Workout, meta: { scheduled: DayType; flexed: boolean }) => void;
  finish: (durationSec: number) => void;
  clear: () => void;
};

export const useActive = create<ActiveState>()((set) => ({
  workout: null,
  meta: null,
  result: null,
  begin: (workout, meta) => set({ workout, meta, result: null }),
  finish: (durationSec) => set({ result: { durationSec } }),
  clear: () => set({ workout: null, meta: null, result: null }),
}));

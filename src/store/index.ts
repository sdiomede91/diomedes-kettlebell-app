import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WeightUnit } from '@/data/bells';
import type { Level } from '@/data/exercises';
import type { Bodyweight, SlotConfig, WorkoutConfig } from '@/engine/config';
import { addDays, todayKey } from '@/engine/date';
import { DEFAULT_ROTATION } from '@/engine/rotation';
import type { DayType, Rotation, SessionLength, TrainingDayType, Workout } from '@/engine/types';

export type { WeightUnit };

export type LogEntry = {
  exerciseId: string;
  weight?: number;
  /** Unit the weight was logged in. Older entries have none — read them as settings.unit. */
  unit?: WeightUnit;
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
  /** Bells owned, kept per unit so switching kg/lb never loses the other list. */
  bells: Record<WeightUnit, number[]>;
  bodyweight?: Bodyweight;
  sound: boolean;
  haptics: boolean;
  reminder: { enabled: boolean; hour: number; minute: number };
};

export const DEFAULT_SETTINGS: Settings = {
  rotation: DEFAULT_ROTATION,
  minutes: 30,
  maxLevel: 'intermediate',
  unit: 'kg',
  bells: { kg: [12, 16, 20, 24], lb: [25, 35, 45, 53] },
  sound: true,
  haptics: true,
  reminder: { enabled: false, hour: 6, minute: 0 },
};

type State = {
  settings: Settings;
  flexOverrides: Record<string, DayType>;
  shuffles: Record<string, number>;
  sessions: SessionLog[];
  /** Reps/load chosen per workout id, keyed by slotKey(). */
  configs: Record<string, { dateKey: string; slots: WorkoutConfig }>;
  lastPreviewDate: string | null;

  setSlot: (workoutId: string, dateKey: string, key: string, slot: SlotConfig) => void;
  resetConfig: (workoutId: string) => void;
  markPreviewed: (dateKey: string) => void;
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
      configs: {},
      lastPreviewDate: null,

      setSlot: (workoutId, dateKey, key, slot) =>
        set((s) => {
          const cutoff = addDays(todayKey(), -14);
          const configs = Object.fromEntries(Object.entries(s.configs).filter(([, c]) => c.dateKey >= cutoff));
          const cur = configs[workoutId] ?? { dateKey, slots: {} };
          configs[workoutId] = { dateKey, slots: { ...cur.slots, [key]: slot } };
          return { configs };
        }),
      resetConfig: (workoutId) =>
        set((s) => {
          const configs = { ...s.configs };
          delete configs[workoutId];
          return { configs };
        }),
      markPreviewed: (dateKey) => set({ lastPreviewDate: dateKey }),
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
          settings: migrateSettings(data.settings),
          flexOverrides: data.flexOverrides ?? {},
          sessions: data.sessions ?? [],
        })),
      resetAll: () =>
        set(() => ({ settings: DEFAULT_SETTINGS, flexOverrides: {}, shuffles: {}, sessions: [], configs: {}, lastPreviewDate: null })),
    }),
    {
      name: 'diomedes-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<State>;
        if (version < 2 && p.settings) p.settings = migrateSettings(p.settings);
        return p as State;
      },
    },
  ),
);

/** v1 stored `bells` as one list in the current unit; v2 keeps a list per unit. */
function migrateSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(raw as Partial<Settings>) };
  const bells = (raw as { bells?: unknown })?.bells;
  if (Array.isArray(bells)) {
    s.bells = { ...DEFAULT_SETTINGS.bells, [s.unit]: bells as number[] };
  }
  return s;
}

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

/** True once persisted state has loaded from storage (avoids acting on defaults at startup). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

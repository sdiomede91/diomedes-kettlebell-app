import { useMemo } from 'react';

import { resolveConfig, type WorkoutConfig } from '@/engine/config';
import { todayKey } from '@/engine/date';
import { generateWorkout } from '@/engine/generate';
import { resolveDay } from '@/engine/rotation';
import type { DayType, Workout } from '@/engine/types';
import { useStore } from '@/store';

export type TodayState = {
  today: string;
  day: DayType;
  scheduled: DayType;
  flexed: boolean;
  workout: Workout | null;
  /** Reps/load per slot — stored choices layered over defaults. */
  config: WorkoutConfig;
};

/** Today's resolved day type, generated workout, and its configuration. */
export function useToday(): TodayState {
  const today = todayKey();
  const settings = useStore((s) => s.settings);
  const flexOverrides = useStore((s) => s.flexOverrides);
  const shuffle = useStore((s) => s.shuffles[today] ?? 0);
  const sessions = useStore((s) => s.sessions);
  const configs = useStore((s) => s.configs);

  const { day, scheduled, flexed } = resolveDay(settings.rotation, flexOverrides, today);

  const workout = useMemo(
    () =>
      day === 'rest'
        ? null
        : generateWorkout({ dateKey: today, dayType: day, minutes: settings.minutes, maxLevel: settings.maxLevel, shuffle }),
    [day, today, settings.minutes, settings.maxLevel, shuffle],
  );

  const stored = workout ? configs[workout.id]?.slots : undefined;
  const config = useMemo(
    () =>
      workout
        ? resolveConfig(workout, stored, { sessions, unit: settings.unit, bells: settings.bells[settings.unit] })
        : {},
    [workout, stored, sessions, settings.unit, settings.bells],
  );

  return { today, day, scheduled, flexed, workout, config };
}

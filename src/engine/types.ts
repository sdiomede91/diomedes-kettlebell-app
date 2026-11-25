import type { Focus, Level } from '@/data/exercises';

import type { Load } from './config';

export type DayType = 'upper' | 'lower' | 'full' | 'mobility' | 'rest';
export type TrainingDayType = Exclude<DayType, 'rest'>;
/** Index 0 = Sunday … 6 = Saturday (matches Date#getDay). */
export type Rotation = [DayType, DayType, DayType, DayType, DayType, DayType, DayType];
export type SessionLength = 20 | 30 | 45;

export type BlockFormat = 'WARMUP' | 'EMOM' | 'INTERVAL' | 'AMRAP' | 'COOLDOWN';

export type BlockExercise = {
  exerciseId: string;
  /** Rep target, e.g. "8", "5/side", "30s". Undefined = work for the whole interval. */
  reps?: string;
  /** Load chosen on the setup screen (set by applyConfig). */
  load?: Load;
};

export type Block = {
  id: string;
  title: string;
  format: BlockFormat;
  /** Short human description, e.g. "EMOM 10 min" or "3 rounds · 40s on / 20s off". */
  scheme: string;
  rounds: number;
  workSec: number;
  restSec: number;
  exercises: BlockExercise[];
  note?: string;
};

export type Workout = {
  id: string;
  dateKey: string;
  dayType: TrainingDayType;
  title: string;
  /** Greek-themed name, e.g. "Argos Ladder". */
  name: string;
  blocks: Block[];
  totalSec: number;
  seed: number;
};

export type GenerateOptions = {
  dateKey: string;
  dayType: TrainingDayType;
  minutes: SessionLength;
  maxLevel: Level;
  /** Bump to reshuffle the same day. */
  shuffle?: number;
};

export const DAY_LABEL: Record<DayType, string> = {
  upper: 'Upper Body',
  lower: 'Lower Body',
  full: 'Full Body',
  mobility: 'Mobility',
  rest: 'Rest',
};

export const DAY_SHORT: Record<DayType, string> = {
  upper: 'Upper',
  lower: 'Lower',
  full: 'Full',
  mobility: 'Mobility',
  rest: 'Rest',
};

export function focusForDay(day: TrainingDayType): Focus | null {
  return day === 'mobility' ? null : day;
}

/**
 * Per-workout configuration: the reps and load chosen for each movement before
 * a session starts. Pure functions only — no React, no storage.
 */
import { BELLS, type WeightUnit } from '@/data/bells';
import { EXERCISE_BY_ID, type Exercise } from '@/data/exercises';

import type { BlockExercise, Workout } from './types';

export type Load =
  | { kind: 'bw'; extra?: number; unit: WeightUnit }
  | { kind: 'bell'; value: number; unit: WeightUnit };

export type SlotConfig = { reps: number | null; load: Load };
export type WorkoutConfig = Record<string, SlotConfig>;
export type Bodyweight = { value: number; unit: WeightUnit };

/** Minimal shape of a logged entry, so this module doesn't depend on the store. */
export type LoggedEntry = { exerciseId: string; weight?: number; unit?: WeightUnit };

export const LB_PER_KG = 2.20462;

export function slotKey(blockId: string, exerciseId: string) {
  return `${blockId}:${exerciseId}`;
}

export function convert(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === 'kg' ? value * LB_PER_KG : value / LB_PER_KG;
}

/** Round for display: whole numbers, or one decimal under 10. */
export function roundWeight(v: number): number {
  return v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
}

export function loadKg(load: Load): number {
  if (load.kind === 'bw') return convert(load.extra ?? 0, load.unit, 'kg');
  return convert(load.value, load.unit, 'kg');
}

/** "8/side" → 8, "10" → 10, "30s" or undefined → null (time-based). */
export function parseReps(reps?: string): number | null {
  if (!reps || /s$/.test(reps.trim())) return null;
  const m = reps.match(/\d+/);
  return m ? Number(m[0]) : null;
}

export function repsLabel(reps: number | null, original?: string): string {
  if (reps === null) return original && /s$/.test(original) ? original : '—';
  return original?.includes('/side') ? `${reps}/side` : String(reps);
}

/** Percent of bodyweight moved, for bodyweight movements. */
export function bodyweightPercent(load: Load, bw?: Bodyweight): number | null {
  if (load.kind !== 'bw' || !bw || bw.value <= 0) return null;
  const bwKg = convert(bw.value, bw.unit, 'kg');
  return Math.round(((bwKg + loadKg(load)) / bwKg) * 100);
}

/** Main label for a load in the display unit, plus an optional secondary line. */
export function formatLoad(load: Load, unit: WeightUnit, bw?: Bodyweight): { main: string; sub?: string } {
  const other: WeightUnit = unit === 'kg' ? 'lb' : 'kg';
  if (load.kind === 'bell') {
    const v = roundWeight(convert(load.value, load.unit, unit));
    const o = roundWeight(convert(load.value, load.unit, other));
    return { main: `${v} ${unit}`, sub: `≈ ${o} ${other}` };
  }
  const pct = bodyweightPercent(load, bw);
  const extra = load.extra ? roundWeight(convert(load.extra, load.unit, unit)) : 0;
  const main = extra ? `BW + ${extra} ${unit}` : 'Bodyweight';
  return { main, sub: pct !== null ? `${pct}% BW` : undefined };
}

/** Compact one-line label, e.g. for the session player: "16 kg", "BW", "BW + 8 kg". */
export function shortLoad(load: Load, unit: WeightUnit): string {
  if (load.kind === 'bell') return `${roundWeight(convert(load.value, load.unit, unit))} ${unit}`;
  return load.extra ? `BW + ${roundWeight(convert(load.extra, load.unit, unit))} ${unit}` : 'BW';
}

function lastLogged(sessions: { entries: LoggedEntry[] }[], exerciseId: string, fallbackUnit: WeightUnit): Load | undefined {
  for (const s of sessions) {
    const e = s.entries.find((x) => x.exerciseId === exerciseId && x.weight !== undefined);
    if (e) return { kind: 'bell', value: e.weight!, unit: e.unit ?? fallbackUnit };
  }
  return undefined;
}

export function defaultSlot(
  ex: Exercise,
  be: BlockExercise,
  ctx: { sessions: { entries: LoggedEntry[] }[]; unit: WeightUnit; bells: number[] },
): SlotConfig {
  const reps = parseReps(be.reps);
  if (ex.bodyweight) return { reps, load: { kind: 'bw', unit: ctx.unit } };
  const last = lastLogged(ctx.sessions, ex.id, ctx.unit);
  if (last) return { reps, load: last };
  const owned = [...ctx.bells].sort((a, b) => a - b);
  const value = owned[1] ?? owned[0] ?? BELLS[ctx.unit][4];
  return { reps, load: { kind: 'bell', value, unit: ctx.unit } };
}

/** Full config for a workout: stored choices layered over defaults. */
export function resolveConfig(
  workout: Workout,
  stored: WorkoutConfig | undefined,
  ctx: Parameters<typeof defaultSlot>[2],
): WorkoutConfig {
  const out: WorkoutConfig = {};
  for (const b of workout.blocks) {
    for (const be of b.exercises) {
      const key = slotKey(b.id, be.exerciseId);
      const ex = EXERCISE_BY_ID[be.exerciseId];
      out[key] = stored?.[key] ?? defaultSlot(ex, be, ctx);
    }
  }
  return out;
}

/** Bake the chosen reps and loads into the workout the session player runs. */
export function applyConfig(workout: Workout, config: WorkoutConfig): Workout {
  return {
    ...workout,
    blocks: workout.blocks.map((b) => ({
      ...b,
      // Warm-up and cool-down aren't configured: their movements are light and timed.
      exercises: b.exercises.map((be) => {
        if (b.format === 'WARMUP' || b.format === 'COOLDOWN') return be;
        const c = config[slotKey(b.id, be.exerciseId)];
        if (!c) return be;
        return { ...be, reps: c.reps === null ? be.reps : repsLabel(c.reps, be.reps), load: c.load };
      }),
    })),
  };
}

/**
 * Session timer — a pure state machine.
 *
 * A workout is flattened into a list of timed phases. The running state only
 * stores the current phase index and the wall-clock time that phase started,
 * so the timer stays correct even if the app is backgrounded: on return,
 * `advance(state, now)` fast-forwards through any phases that elapsed.
 */
import type { Load } from './config';
import type { Workout } from './types';

export type PhaseKind = 'ready' | 'work' | 'rest';

export type Phase = {
  kind: PhaseKind;
  durationSec: number;
  blockIndex: number;
  blockTitle: string;
  /** 1-based round / minute within the block. */
  round: number;
  totalRounds: number;
  exerciseIds: string[];
  reps?: string;
  load?: Load;
  /** Unilateral interval work: cue to switch sides at the halfway mark. */
  switchSides?: boolean;
  label: string;
};

export const READY_SEC = 10;

export function buildTimeline(workout: Workout, unilateralIds: Set<string> = new Set()): Phase[] {
  const phases: Phase[] = [];
  workout.blocks.forEach((b, blockIndex) => {
    const base = { blockIndex, blockTitle: b.title };
    phases.push({
      ...base,
      kind: 'ready',
      durationSec: READY_SEC,
      round: 0,
      totalRounds: b.rounds,
      exerciseIds: b.exercises.map((e) => e.exerciseId),
      label: `Up next: ${b.title}`,
    });

    if (b.format === 'AMRAP') {
      phases.push({
        ...base,
        kind: 'work',
        durationSec: b.workSec,
        round: 1,
        totalRounds: 1,
        exerciseIds: b.exercises.map((e) => e.exerciseId),
        label: 'As many rounds as possible',
      });
      return;
    }

    if (b.format === 'EMOM') {
      for (let m = 0; m < b.rounds; m++) {
        const ex = b.exercises[m % b.exercises.length];
        phases.push({
          ...base,
          kind: 'work',
          durationSec: 60,
          round: m + 1,
          totalRounds: b.rounds,
          exerciseIds: [ex.exerciseId],
          reps: ex.reps,
          load: ex.load,
          label: `Minute ${m + 1} of ${b.rounds}`,
        });
      }
      return;
    }

    // WARMUP, INTERVAL, COOLDOWN
    for (let r = 0; r < b.rounds; r++) {
      b.exercises.forEach((ex, i) => {
        phases.push({
          ...base,
          kind: 'work',
          durationSec: b.workSec,
          round: r + 1,
          totalRounds: b.rounds,
          exerciseIds: [ex.exerciseId],
          reps: ex.reps,
          load: ex.load,
          switchSides: unilateralIds.has(ex.exerciseId) && b.format === 'INTERVAL',
          label: b.rounds > 1 ? `Round ${r + 1} of ${b.rounds}` : `${i + 1} of ${b.exercises.length}`,
        });
        const last = r === b.rounds - 1 && i === b.exercises.length - 1;
        if (b.restSec > 0 && !last) {
          phases.push({
            ...base,
            kind: 'rest',
            durationSec: b.restSec,
            round: r + 1,
            totalRounds: b.rounds,
            exerciseIds: [],
            label: 'Rest',
          });
        }
      });
    }
  });
  return phases;
}

export function timelineDuration(phases: Phase[]): number {
  return phases.reduce((s, p) => s + p.durationSec, 0);
}

export type TimerState = {
  index: number;
  /** Wall-clock ms at which the current phase (effectively) started. */
  phaseStartedAt: number;
  /** Set while paused. */
  pausedAt: number | null;
  done: boolean;
};

export function startTimer(now: number): TimerState {
  return { index: 0, phaseStartedAt: now, pausedAt: null, done: false };
}

function effectiveNow(s: TimerState, now: number) {
  return s.pausedAt ?? now;
}

/** Fast-forward through every phase that has fully elapsed. */
export function advance(s: TimerState, phases: Phase[], now: number): TimerState {
  if (s.done) return s;
  const t = effectiveNow(s, now);
  let { index, phaseStartedAt } = s;
  while (index < phases.length && t - phaseStartedAt >= phases[index].durationSec * 1000) {
    phaseStartedAt += phases[index].durationSec * 1000;
    index++;
  }
  if (index >= phases.length) return { ...s, index: phases.length - 1, phaseStartedAt, done: true };
  if (index === s.index && phaseStartedAt === s.phaseStartedAt) return s;
  return { ...s, index, phaseStartedAt };
}

export function remainingMs(s: TimerState, phases: Phase[], now: number): number {
  if (s.done) return 0;
  const p = phases[s.index];
  return Math.max(0, p.durationSec * 1000 - (effectiveNow(s, now) - s.phaseStartedAt));
}

export function pause(s: TimerState, now: number): TimerState {
  return s.pausedAt !== null || s.done ? s : { ...s, pausedAt: now };
}

export function resume(s: TimerState, now: number): TimerState {
  if (s.pausedAt === null) return s;
  return { ...s, phaseStartedAt: s.phaseStartedAt + (now - s.pausedAt), pausedAt: null };
}

export function skip(s: TimerState, phases: Phase[], now: number): TimerState {
  if (s.done) return s;
  if (s.index >= phases.length - 1) return { ...s, done: true };
  return { ...s, index: s.index + 1, phaseStartedAt: now, pausedAt: s.pausedAt === null ? null : now };
}

export function back(s: TimerState, now: number): TimerState {
  const t = effectiveNow(s, now);
  // If more than 3s into the phase, restart it; otherwise go to the previous phase.
  const index = t - s.phaseStartedAt > 3000 || s.index === 0 ? s.index : s.index - 1;
  return { ...s, index, phaseStartedAt: now, pausedAt: s.pausedAt === null ? null : now, done: false };
}

/** Seconds elapsed in the whole session (for the summary). */
export function elapsedSec(s: TimerState, phases: Phase[], now: number): number {
  const before = phases.slice(0, s.index).reduce((a, p) => a + p.durationSec, 0);
  if (s.done) return before + phases[s.index].durationSec;
  return before + Math.floor((effectiveNow(s, now) - s.phaseStartedAt) / 1000);
}

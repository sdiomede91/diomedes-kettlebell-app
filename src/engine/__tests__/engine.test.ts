import { EXERCISE_BY_ID } from '@/data/exercises';
import { addDays } from '@/engine/date';
import { generateWorkout } from '@/engine/generate';
import { DEFAULT_ROTATION, resolveDay, scheduledDay } from '@/engine/rotation';
import { currentStreak, longestStreak } from '@/engine/streak';
import {
  advance, back, buildTimeline, elapsedSec, pause, remainingMs, resume, skip, startTimer, timelineDuration,
} from '@/engine/timer';
import type { Rotation } from '@/engine/types';

// 2026-11-16 is a Monday.
const MON = '2026-11-16';

describe('rotation', () => {
  it('maps weekdays using the default rotation', () => {
    expect(scheduledDay(DEFAULT_ROTATION, MON)).toBe('upper');
    expect(scheduledDay(DEFAULT_ROTATION, addDays(MON, 1))).toBe('lower');
    expect(scheduledDay(DEFAULT_ROTATION, addDays(MON, 2))).toBe('full');
    expect(scheduledDay(DEFAULT_ROTATION, addDays(MON, 3))).toBe('mobility');
    expect(scheduledDay(DEFAULT_ROTATION, addDays(MON, 6))).toBe('full');
  });

  it('applies a flex override only to its own date', () => {
    const flex = { [MON]: 'lower' as const };
    expect(resolveDay(DEFAULT_ROTATION, flex, MON)).toEqual({ day: 'lower', scheduled: 'upper', flexed: true });
    expect(resolveDay(DEFAULT_ROTATION, flex, addDays(MON, 7))).toEqual({ day: 'upper', scheduled: 'upper', flexed: false });
  });
});

describe('generateWorkout', () => {
  const base = { dateKey: MON, dayType: 'upper' as const, minutes: 30 as const, maxLevel: 'intermediate' as const };

  it('is deterministic for the same day', () => {
    expect(generateWorkout(base)).toEqual(generateWorkout(base));
  });

  it('changes when reshuffled', () => {
    const a = generateWorkout(base);
    const b = generateWorkout({ ...base, shuffle: 1 });
    expect(a.seed).not.toBe(b.seed);
  });

  it('respects the level cap and never repeats a main-block movement', () => {
    for (let i = 0; i < 30; i++) {
      const w = generateWorkout({ ...base, dateKey: addDays(MON, i), maxLevel: 'base' });
      const ids = w.blocks.flatMap((b) => b.exercises.map((e) => e.exerciseId));
      ids.forEach((id) => expect(EXERCISE_BY_ID[id].level).toBe('base'));
    }
    const w = generateWorkout(base);
    const main = w.blocks.filter((b) => b.format === 'EMOM' || b.format === 'INTERVAL').flatMap((b) => b.exercises.map((e) => e.exerciseId));
    expect(new Set(main).size).toBe(main.length);
  });

  it('upper days favour upper-body movements in the strength block', () => {
    for (let i = 0; i < 20; i++) {
      const w = generateWorkout({ ...base, dateKey: addDays(MON, i) });
      const emom = w.blocks.find((b) => b.format === 'EMOM')!;
      emom.exercises.forEach((e) => expect(EXERCISE_BY_ID[e.exerciseId].focus).toContain('upper'));
    }
  });

  it.each([20, 30, 45] as const)('a %i-minute session lands near its target length', (minutes) => {
    for (const dayType of ['upper', 'lower', 'full', 'mobility'] as const) {
      const w = generateWorkout({ ...base, minutes, dayType });
      expect(w.totalSec / 60).toBeGreaterThan(minutes * 0.75);
      expect(w.totalSec / 60).toBeLessThan(minutes * 1.25);
    }
  });
});

describe('timer', () => {
  const w = generateWorkout({ dateKey: MON, dayType: 'full', minutes: 20, maxLevel: 'intermediate' });
  const phases = buildTimeline(w);
  const T0 = 1_000_000;

  it('starts on a ready phase and counts down', () => {
    const s = startTimer(T0);
    expect(phases[0].kind).toBe('ready');
    expect(remainingMs(s, phases, T0 + 4000)).toBe(phases[0].durationSec * 1000 - 4000);
  });

  it('fast-forwards through phases after a long background gap', () => {
    const gap = (phases[0].durationSec + phases[1].durationSec + 5) * 1000;
    const s = advance(startTimer(T0), phases, T0 + gap);
    expect(s.index).toBe(2);
    expect(remainingMs(s, phases, T0 + gap)).toBe((phases[2].durationSec - 5) * 1000);
  });

  it('pause freezes time and resume continues where it left off', () => {
    let s = startTimer(T0);
    s = pause(s, T0 + 3000);
    s = advance(s, phases, T0 + 60_000);
    expect(s.index).toBe(0);
    expect(remainingMs(s, phases, T0 + 60_000)).toBe(phases[0].durationSec * 1000 - 3000);
    s = resume(s, T0 + 60_000);
    expect(remainingMs(s, phases, T0 + 61_000)).toBe(phases[0].durationSec * 1000 - 4000);
  });

  it('skip and back move between phases', () => {
    let s = skip(startTimer(T0), phases, T0 + 1000);
    expect(s.index).toBe(1);
    s = back(s, T0 + 2000); // <3s into phase → previous
    expect(s.index).toBe(0);
  });

  it('finishes after the whole timeline', () => {
    const total = timelineDuration(phases);
    const s = advance(startTimer(T0), phases, T0 + total * 1000 + 1);
    expect(s.done).toBe(true);
    expect(elapsedSec(s, phases, T0 + total * 1000 + 1)).toBe(total);
  });
});

describe('streak', () => {
  const withRest: Rotation = ['rest', 'upper', 'lower', 'full', 'rest', 'upper', 'lower'];

  it('counts consecutive training days and lets rest days pass', () => {
    // Fri 20, Sat 21 trained; Sun 22 rest; Mon 23 = today, not yet trained.
    const done = new Set(['2026-11-20', '2026-11-21']);
    expect(currentStreak(done, withRest, '2026-11-23')).toBe(2);
  });

  it('breaks on a missed training day', () => {
    const done = new Set(['2026-11-17', '2026-11-19']); // Wed 18 missed
    expect(currentStreak(done, withRest, '2026-11-19')).toBe(1);
    expect(longestStreak(done, withRest)).toBe(1);
  });

  it('today counts once trained', () => {
    const done = new Set(['2026-11-18', '2026-11-19']);
    expect(currentStreak(done, DEFAULT_ROTATION, '2026-11-19')).toBe(2);
  });
});

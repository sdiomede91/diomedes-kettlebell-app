import { EXERCISE_BY_ID } from '@/data/exercises';
import {
  applyConfig,
  bodyweightPercent,
  convert,
  defaultSlot,
  formatLoad,
  parseReps,
  repsLabel,
  resolveConfig,
  roundWeight,
  slotKey,
} from '@/engine/config';
import { generateWorkout } from '@/engine/generate';

const ctx = { sessions: [], unit: 'kg' as const, bells: [12, 16, 20, 24] };
const MON = '2026-11-16';

describe('workout names', () => {
  it('are deterministic and change on reshuffle', () => {
    const base = { dateKey: MON, dayType: 'upper' as const, minutes: 30 as const, maxLevel: 'intermediate' as const };
    const a = generateWorkout(base);
    expect(a.name).toMatch(/^[A-Z][\w']+ [A-Z]\w+$/);
    expect(generateWorkout(base).name).toBe(a.name);
    const names = new Set(Array.from({ length: 12 }, (_, i) => generateWorkout({ ...base, shuffle: i }).name));
    expect(names.size).toBeGreaterThan(3);
  });
});

describe('reps', () => {
  it('parses rep strings', () => {
    expect(parseReps('8')).toBe(8);
    expect(parseReps('5/side')).toBe(5);
    expect(parseReps('30s')).toBeNull();
    expect(parseReps(undefined)).toBeNull();
  });
  it('labels keep per-side and time targets', () => {
    expect(repsLabel(6, '5/side')).toBe('6/side');
    expect(repsLabel(null, '40s')).toBe('40s');
    expect(repsLabel(null)).toBe('—');
  });
});

describe('units', () => {
  it('round-trips 53 lb through kg', () => {
    expect(roundWeight(convert(convert(53, 'lb', 'kg'), 'kg', 'lb'))).toBe(53);
    expect(roundWeight(convert(53, 'lb', 'kg'))).toBe(24);
  });
  it('formats bell loads in either unit', () => {
    const l = { kind: 'bell', value: 16, unit: 'kg' } as const;
    expect(formatLoad(l, 'kg')).toEqual({ main: '16 kg', sub: '≈ 35 lb' });
    expect(formatLoad(l, 'lb')).toEqual({ main: '35 lb', sub: '≈ 16 kg' });
  });
  it('shows bodyweight movements as % of bodyweight', () => {
    const bw = { value: 200, unit: 'lb' } as const;
    expect(bodyweightPercent({ kind: 'bw', unit: 'lb' }, bw)).toBe(100);
    expect(bodyweightPercent({ kind: 'bw', extra: 20, unit: 'lb' }, bw)).toBe(110);
    expect(formatLoad({ kind: 'bw', extra: 20, unit: 'lb' }, 'lb', bw)).toEqual({ main: 'BW + 20 lb', sub: '110% BW' });
    expect(formatLoad({ kind: 'bw', unit: 'kg' }, 'kg')).toEqual({ main: 'Bodyweight', sub: undefined });
  });
});

describe('defaults', () => {
  it('bodyweight movements default to bodyweight', () => {
    const s = defaultSlot(EXERCISE_BY_ID['push-up'], { exerciseId: 'push-up', reps: '5' }, ctx);
    expect(s).toEqual({ reps: 5, load: { kind: 'bw', unit: 'kg' } });
  });
  it('bell movements use the last logged weight, in the unit it was logged', () => {
    const sessions = [{ entries: [{ exerciseId: 'goblet-squat', weight: 53, unit: 'lb' as const }] }];
    const s = defaultSlot(EXERCISE_BY_ID['goblet-squat'], { exerciseId: 'goblet-squat', reps: '8' }, { ...ctx, sessions });
    expect(s.load).toEqual({ kind: 'bell', value: 53, unit: 'lb' });
  });
  it('otherwise the second-smallest bell owned', () => {
    const s = defaultSlot(EXERCISE_BY_ID['goblet-squat'], { exerciseId: 'goblet-squat', reps: '8' }, ctx);
    expect(s.load).toEqual({ kind: 'bell', value: 16, unit: 'kg' });
  });
});

describe('applyConfig', () => {
  it('bakes chosen reps and loads into main blocks only', () => {
    const w = generateWorkout({ dateKey: MON, dayType: 'lower', minutes: 30, maxLevel: 'intermediate' });
    const emom = w.blocks.find((b) => b.format === 'EMOM')!;
    const first = emom.exercises[0];
    const cfg = resolveConfig(w, { [slotKey(emom.id, first.exerciseId)]: { reps: 12, load: { kind: 'bell', value: 53, unit: 'lb' } } }, ctx);
    const out = applyConfig(w, cfg);
    const ex = out.blocks.find((b) => b.id === emom.id)!.exercises[0];
    expect(ex.load).toEqual({ kind: 'bell', value: 53, unit: 'lb' });
    expect(parseReps(ex.reps)).toBe(12);
    out.blocks.filter((b) => b.format === 'WARMUP' || b.format === 'COOLDOWN').forEach((b) => b.exercises.forEach((e) => expect(e.load).toBeUndefined()));
  });
});

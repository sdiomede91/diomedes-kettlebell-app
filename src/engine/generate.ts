import { EXERCISES, LEVEL_RANK, type Exercise, type Focus, type Level, type Pattern } from '@/data/exercises';

import { workoutName } from './names';
import { hashString, mulberry32 } from './random';
import { timelineDuration, buildTimeline } from './timer';
import {
  DAY_LABEL,
  focusForDay,
  type Block,
  type BlockExercise,
  type GenerateOptions,
  type SessionLength,
  type TrainingDayType,
  type Workout,
} from './types';

type Slots = { emom: Pattern[]; circuit: Pattern[]; amrap: Pattern[] };

const SLOTS: Record<TrainingDayType, Slots> = {
  upper: { emom: ['press', 'pull'], circuit: ['ballistic', 'press', 'pull', 'core'], amrap: ['press', 'pull', 'core'] },
  lower: { emom: ['squat', 'hinge'], circuit: ['ballistic', 'lunge', 'hinge', 'squat'], amrap: ['ballistic', 'lunge', 'carry'] },
  full: { emom: ['ballistic', 'squat'], circuit: ['hinge', 'press', 'pull', 'lunge'], amrap: ['ballistic', 'squat', 'press'] },
  mobility: { emom: [], circuit: ['mobility', 'core', 'carry', 'mobility', 'core'], amrap: [] },
};

/** Minutes for each main block by session length. */
const BUDGET: Record<SessionLength, { emom: number; circuitRounds: number; amrap: number; mobilityRounds: number }> = {
  20: { emom: 8, circuitRounds: 2, amrap: 0, mobilityRounds: 3 },
  30: { emom: 10, circuitRounds: 3, amrap: 4, mobilityRounds: 5 },
  45: { emom: 14, circuitRounds: 5, amrap: 8, mobilityRounds: 8 },
};

const STRENGTH_REPS: Record<Pattern, string> = {
  ballistic: '10',
  press: '5',
  pull: '8',
  squat: '8',
  lunge: '6',
  hinge: '8',
  core: '6',
  carry: '30s',
  mobility: '5',
};

function repsFor(ex: Exercise, base = STRENGTH_REPS[ex.pattern]): string {
  if (ex.id === 'turkish-get-up') return '1/side';
  if (ex.id === 'windmill') return '3/side';
  if (base.endsWith('s')) return base;
  return ex.unilateral ? `${base}/side` : base;
}

class Picker {
  private used = new Set<string>();
  constructor(
    private rng: () => number,
    private focus: Focus | null,
    private maxLevel: Level,
  ) {}

  pick(pattern: Pattern): Exercise {
    const allowed = EXERCISES.filter((e) => LEVEL_RANK[e.level] <= LEVEL_RANK[this.maxLevel]);
    const tiers: Exercise[][] = [
      allowed.filter((e) => e.pattern === pattern && this.matchesFocus(e) && !this.used.has(e.id)),
      allowed.filter((e) => e.pattern === pattern && !this.used.has(e.id)),
      allowed.filter((e) => e.pattern === pattern),
      allowed.filter((e) => this.matchesFocus(e) && !this.used.has(e.id)),
      allowed,
    ];
    const pool = tiers.find((t) => t.length > 0)!;
    const ex = pool[Math.floor(this.rng() * pool.length)];
    this.used.add(ex.id);
    return ex;
  }

  private matchesFocus(e: Exercise) {
    return this.focus === null || e.focus.includes(this.focus);
  }
}

export function generateWorkout(opts: GenerateOptions): Workout {
  const { dateKey, dayType, minutes, maxLevel, shuffle = 0 } = opts;
  const seed = hashString(`${dateKey}|${dayType}|${minutes}|${maxLevel}|${shuffle}`);
  const rng = mulberry32(seed);
  const focus = focusForDay(dayType);
  const picker = new Picker(rng, focus, maxLevel);
  const budget = BUDGET[minutes];
  const slots = SLOTS[dayType];
  const blocks: Block[] = [];

  // Warm-up: three mobility drills.
  const warm = [picker.pick('mobility'), picker.pick('mobility'), picker.pick(dayType === 'upper' ? 'core' : 'hinge')];
  blocks.push({
    id: 'warmup',
    title: 'Warm-Up',
    format: 'WARMUP',
    scheme: '1 round · 40s on / 10s off',
    rounds: 1,
    workSec: 40,
    restSec: 10,
    exercises: warm.map((e) => ({ exerciseId: e.id })),
    note: 'Light bell. Wake up the hips and shoulders.',
  });

  if (dayType === 'mobility') {
    const ex = slots.circuit.map((p) => picker.pick(p));
    blocks.push({
      id: 'flow',
      title: 'Mobility Flow',
      format: 'INTERVAL',
      scheme: `${budget.mobilityRounds} rounds · 45s on / 15s off`,
      rounds: budget.mobilityRounds,
      workSec: 45,
      restSec: 15,
      exercises: ex.map((e) => ({ exerciseId: e.id, reps: e.pattern === 'carry' ? '45s' : undefined })),
      note: 'Slow and deliberate. Breathe through the range.',
    });
  } else {
    // A — EMOM strength
    const emomEx = slots.emom.map((p) => picker.pick(p));
    blocks.push({
      id: 'emom',
      title: 'Strength',
      format: 'EMOM',
      scheme: `EMOM ${budget.emom} min`,
      rounds: budget.emom,
      workSec: 60,
      restSec: 0,
      exercises: emomEx.map((e) => ({ exerciseId: e.id, reps: repsFor(e) })),
      note: 'Alternate movements each minute. Finish the reps, rest the remainder.',
    });

    // B — Interval circuit
    const circ = slots.circuit.map((p) => picker.pick(p));
    blocks.push({
      id: 'circuit',
      title: 'Conditioning',
      format: 'INTERVAL',
      scheme: `${budget.circuitRounds} rounds · 40s on / 20s off`,
      rounds: budget.circuitRounds,
      workSec: 40,
      restSec: 20,
      exercises: circ.map((e) => ({ exerciseId: e.id, reps: e.pattern === 'carry' ? '40s' : undefined })),
      note: 'Steady pace. Single-arm work switches sides at the halfway beep.',
    });

    // C — AMRAP finisher
    if (budget.amrap > 0) {
      const am = slots.amrap.map((p) => picker.pick(p));
      blocks.push({
        id: 'amrap',
        title: 'Finisher',
        format: 'AMRAP',
        scheme: `AMRAP ${budget.amrap} min`,
        rounds: 1,
        workSec: budget.amrap * 60,
        restSec: 0,
        exercises: am.map((e) => ({ exerciseId: e.id, reps: repsFor(e, e.pattern === 'ballistic' ? '12' : STRENGTH_REPS[e.pattern]) })),
        note: 'As many rounds as possible. Quality over speed.',
      });
    }
  }

  // Cool-down
  const cool: BlockExercise[] = [picker.pick('mobility'), picker.pick('core')].map((e) => ({ exerciseId: e.id }));
  blocks.push({
    id: 'cooldown',
    title: 'Cool-Down',
    format: 'COOLDOWN',
    scheme: '1 round · 45s each',
    rounds: 1,
    workSec: 45,
    restSec: 0,
    exercises: cool,
    note: 'Bring the breath down. Done quietly.',
  });

  const workout: Workout = {
    id: `${dateKey}-${dayType}-${seed.toString(36)}`,
    dateKey,
    dayType,
    title: DAY_LABEL[dayType],
    name: workoutName(seed, blocks),
    blocks,
    totalSec: 0,
    seed,
  };
  workout.totalSec = timelineDuration(buildTimeline(workout));
  return workout;
}

import { mulberry32 } from './random';
import type { Block } from './types';

const FIRST = [
  'Argos',
  'Tydeus',
  'Athena',
  'Sthenelus',
  'Rhesus',
  'Thracian',
  'Aegis',
  'Bronze',
  'Myrmidon',
  'Ithaca',
  "Hector's",
  'Scamander',
  'Olympus',
  'Odyssey',
  'Laurel',
  'Spear',
  'Night',
  'Silent',
];

/** Format word, chosen by the session's main block so the name hints at the work. */
const SECOND: Record<string, string[]> = {
  EMOM: ['Ladder', 'Watch', 'Forge'],
  INTERVAL: ['Raid', 'Gauntlet', 'March'],
  AMRAP: ['Grind', 'Rampart'],
};

export function workoutName(seed: number, blocks: Block[]): string {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const main = blocks.find((b) => b.format === 'EMOM') ?? blocks.find((b) => b.format === 'INTERVAL');
  const pool = SECOND[main?.format ?? 'INTERVAL'];
  const first = FIRST[Math.floor(rng() * FIRST.length)];
  const second = pool[Math.floor(rng() * pool.length)];
  return `${first} ${second}`;
}

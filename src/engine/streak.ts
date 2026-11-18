import { addDays } from './date';
import { scheduledDay } from './rotation';
import type { Rotation } from './types';

/**
 * A day "holds" the streak if a session was completed, or if it was a
 * scheduled rest day. Rest days pass through without adding to the count.
 * Today never breaks the streak — you still have time.
 */
export function currentStreak(completed: Set<string>, rotation: Rotation, today: string): number {
  let count = 0;
  let day = today;
  if (!completed.has(today)) day = addDays(today, -1);
  for (let guard = 0; guard < 3650; guard++) {
    if (completed.has(day)) count++;
    else if (scheduledDay(rotation, day) !== 'rest') break;
    day = addDays(day, -1);
  }
  return count;
}

export function longestStreak(completed: Set<string>, rotation: Rotation): number {
  if (completed.size === 0) return 0;
  const days = [...completed].sort();
  let best = 0;
  let run = 0;
  let day = days[0];
  const last = days[days.length - 1];
  while (day <= last) {
    if (completed.has(day)) {
      run++;
      best = Math.max(best, run);
    } else if (scheduledDay(rotation, day) !== 'rest') {
      run = 0;
    }
    day = addDays(day, 1);
  }
  return best;
}

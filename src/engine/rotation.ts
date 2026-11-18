import { fromDateKey } from './date';
import type { DayType, Rotation } from './types';

/** Sun Full · Mon Upper · Tue Lower · Wed Full · Thu Mobility · Fri Upper · Sat Lower */
export const DEFAULT_ROTATION: Rotation = ['full', 'upper', 'lower', 'full', 'mobility', 'upper', 'lower'];

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function scheduledDay(rotation: Rotation, dateKey: string): DayType {
  return rotation[fromDateKey(dateKey).getDay()];
}

/** What the user is training today: a flex override wins over the rotation, for that date only. */
export function resolveDay(
  rotation: Rotation,
  flexOverrides: Record<string, DayType>,
  dateKey: string,
): { day: DayType; scheduled: DayType; flexed: boolean } {
  const scheduled = scheduledDay(rotation, dateKey);
  const override = flexOverrides[dateKey];
  if (override && override !== scheduled) return { day: override, scheduled, flexed: true };
  return { day: scheduled, scheduled, flexed: false };
}

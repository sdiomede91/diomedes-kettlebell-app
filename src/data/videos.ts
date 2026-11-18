/**
 * Exercise video registry.
 *
 * To add a movement video:
 *   1. Drop the file into `assets/videos/<exercise-id>.mp4`
 *      (ids are in src/data/exercises.ts — e.g. `two-hand-swing.mp4`).
 *   2. Add one line below:  'two-hand-swing': require('@/assets/videos/two-hand-swing.mp4'),
 *
 * You can also point an id at a hosted file instead of bundling it:
 *   'snatch': 'https://cdn.example.com/diomedes/snatch.mp4',
 *
 * Any exercise without an entry shows a "Film coming" placeholder.
 */
export type VideoSource = number | string;

export const VIDEOS: Record<string, VideoSource> = {
  // 'two-hand-swing': require('@/assets/videos/two-hand-swing.mp4'),
};

export function videoFor(exerciseId: string): VideoSource | undefined {
  return VIDEOS[exerciseId];
}

export type WeightUnit = 'kg' | 'lb';

/** Standard kettlebell sizes. */
export const BELLS: Record<WeightUnit, number[]> = {
  kg: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48],
  lb: [10, 15, 20, 25, 30, 35, 40, 45, 50, 53, 60, 70, 80, 90, 106],
};

/** Extra load options for bodyweight movements (vest, plate, bell on the back). */
export const BW_EXTRA: Record<WeightUnit, number[]> = {
  kg: [2, 4, 5, 6, 8, 10, 12, 16, 20, 24],
  lb: [5, 10, 15, 20, 25, 35, 45, 53],
};

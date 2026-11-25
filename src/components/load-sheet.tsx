import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BELLS, BW_EXTRA, type WeightUnit } from '@/data/bells';
import type { Exercise } from '@/data/exercises';
import { bodyweightPercent, convert, roundWeight, type Bodyweight, type Load } from '@/engine/config';
import { Space, usePalette } from '@/theme';

import { SelectSheet, UnitToggle, type SelectSection } from './sheet';
import { T } from './ui';

function same(a: Load, b: Load) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'bw' && b.kind === 'bw') return Math.abs(convert(a.extra ?? 0, a.unit, 'kg') - convert(b.extra ?? 0, b.unit, 'kg')) < 0.3;
  if (a.kind === 'bell' && b.kind === 'bell') return Math.abs(convert(a.value, a.unit, 'kg') - convert(b.value, b.unit, 'kg')) < 0.3;
  return false;
}

/** Load picker: KG/LB toggle, your bells first, all sizes, bodyweight (with % when known). */
export function LoadSheet({
  visible,
  onClose,
  exercise,
  context,
  value,
  onChange,
  unit,
  onUnit,
  owned,
  bodyweight,
}: {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise;
  context: string;
  value: Load;
  onChange: (l: Load) => void;
  unit: WeightUnit;
  onUnit: (u: WeightUnit) => void;
  owned: number[];
  bodyweight?: Bodyweight;
}) {
  const p = usePalette();
  const bwLabel = bodyweight ? `Bodyweight (${roundWeight(convert(bodyweight.value, bodyweight.unit, unit))} ${unit})` : 'Bodyweight';
  const pct = (l: Load) => {
    const v = bodyweightPercent(l, bodyweight);
    return v === null ? undefined : `${v}%`;
  };

  const bwOptions = [
    { value: { kind: 'bw', unit } as Load, label: bwLabel, detail: pct({ kind: 'bw', unit }) },
    ...BW_EXTRA[unit].map((x) => {
      const l: Load = { kind: 'bw', extra: x, unit };
      return { value: l, label: `BW + ${x} ${unit}`, detail: pct(l) };
    }),
  ];
  const bell = (v: number) => {
    const l: Load = { kind: 'bell', value: v, unit };
    const other: WeightUnit = unit === 'kg' ? 'lb' : 'kg';
    return { value: l, label: `${v} ${unit}`, detail: `≈ ${roundWeight(convert(v, unit, other))} ${other}`, starred: owned.includes(v) };
  };

  const sections: SelectSection<Load>[] = exercise.bodyweight
    ? [{ options: bwOptions }, { title: 'Kettlebell', options: BELLS[unit].map(bell) }]
    : [
        { title: 'Your bells', options: owned.map(bell) },
        { title: 'All sizes', options: BELLS[unit].filter((b) => !owned.includes(b)).map(bell) },
        { title: 'No bell', options: bwOptions.slice(0, 1) },
      ];

  return (
    <SelectSheet
      visible={visible}
      onClose={onClose}
      title="Select load"
      subtitle={`${exercise.name} · ${context}`}
      header={
        <View style={{ alignItems: 'center', gap: Space.sm }}>
          <UnitToggle unit={unit} onChange={onUnit} />
          {exercise.bodyweight && !bodyweight ? (
            <Pressable
              onPress={() => {
                onClose();
                router.push('/settings');
              }}>
              <T variant="small" color={p.accent}>
                Set your bodyweight in Settings to see %
              </T>
            </Pressable>
          ) : null}
        </View>
      }
      sections={sections}
      isSelected={(l) => same(l, value)}
      onSelect={onChange}
    />
  );
}

import { ScrollView, View } from 'react-native';

import { creedForDate } from '@/data/creeds';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { repsLabel, shortLoad, slotKey, type WorkoutConfig } from '@/engine/config';
import { DAY_LABEL, type DayType, type Workout } from '@/engine/types';
import { useStore } from '@/store';
import { dayColor, Font, Radius, Space, usePalette } from '@/theme';

import { Meander } from './meander';
import { Sheet } from './sheet';
import { Button, Row, T } from './ui';

export function PreviewSheet({
  visible,
  onClose,
  onSetUp,
  workout,
  config,
  flexed,
  scheduled,
}: {
  visible: boolean;
  onClose: () => void;
  onSetUp: () => void;
  workout: Workout;
  config: WorkoutConfig;
  flexed: boolean;
  scheduled: DayType;
}) {
  const p = usePalette();
  const unit = useStore((s) => s.settings.unit);
  const tint = dayColor(workout.dayType, p);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Today's Work"
      maxHeight={0.9}
      footer={
        <>
          <Button title="Set up workout" onPress={onSetUp} />
          <Button title="Close" kind="ghost" onPress={onClose} />
        </>
      }>
      <ScrollView contentContainerStyle={{ padding: Space.md, gap: Space.md }}>
        <Meander height={12} opacity={0.55} />
        <T variant="display" style={{ fontSize: 30, lineHeight: 38 }}>
          {workout.name}
        </T>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          <Tag label={DAY_LABEL[workout.dayType]} bg={tint} fg={p.bg} />
          <Tag label={`⏱ ${Math.round(workout.totalSec / 60)} min`} bg={p.surfaceAlt} fg={p.text} />
          {flexed ? <Tag label={`Flexed from ${DAY_LABEL[scheduled]}`} bg={p.surfaceAlt} fg={p.textMuted} /> : null}
        </Row>
        <View style={{ backgroundColor: p.surface, borderRadius: Radius.md, padding: Space.md, borderWidth: 1, borderColor: p.border }}>
          <T style={{ fontFamily: Font.displaySemi, fontSize: 15, lineHeight: 23 }}>{creedForDate(workout.dateKey)}</T>
        </View>

        {workout.blocks.map((b, i) => (
          <View key={b.id} style={{ gap: Space.sm }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <T style={{ fontFamily: Font.displaySemi, fontSize: 17 }}>
                {String.fromCharCode(65 + i)} · {b.title}
              </T>
              <T variant="small">{b.scheme}</T>
            </Row>
            <View style={{ borderLeftWidth: 3, borderLeftColor: tint, paddingLeft: Space.md, gap: 10 }}>
              {b.exercises.map((e) => {
                const c = config[slotKey(b.id, e.exerciseId)];
                const reps = c ? repsLabel(c.reps, e.reps) : (e.reps ?? '—');
                const timed = reps === '—';
                return (
                  <Row key={e.exerciseId} style={{ justifyContent: 'space-between' }}>
                    <T style={{ flex: 1, fontSize: 16 }}>{EXERCISE_BY_ID[e.exerciseId]?.name}</T>
                    <T variant="muted">
                      {timed ? `${b.workSec}s` : /\d$/.test(reps) ? `${reps} reps` : reps}
                      {c && b.format !== 'WARMUP' && b.format !== 'COOLDOWN' ? ` · ${shortLoad(c.load, unit)}` : ''}
                    </T>
                  </Row>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

function Tag({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 }}>
      <T style={{ fontFamily: Font.semibold, fontSize: 13, color: fg }}>{label}</T>
    </View>
  );
}

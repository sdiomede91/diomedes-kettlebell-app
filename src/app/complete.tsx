import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Meander } from '@/components/meander';
import { Button, Card, Chip, Row, Screen, T } from '@/components/ui';
import { creedForDate } from '@/data/creeds';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { DAY_LABEL } from '@/engine/types';
import { lastWeight, useActive, useStore, type LogEntry } from '@/store';
import { Font, Radius, Space, usePalette } from '@/theme';

export default function Complete() {
  const workout = useActive((s) => s.workout);
  const meta = useActive((s) => s.meta);
  const result = useActive((s) => s.result);
  if (!workout || !meta || !result) return <Redirect href="/" />;
  return <CompleteInner />;
}

function CompleteInner() {
  const p = usePalette();
  const workout = useActive((s) => s.workout)!;
  const meta = useActive((s) => s.meta)!;
  const result = useActive((s) => s.result)!;
  const clear = useActive((s) => s.clear);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const logSession = useStore((s) => s.logSession);

  // Only main blocks are worth logging (not warm-up / cool-down).
  const rows = useMemo(() => {
    const seen = new Set<string>();
    return workout.blocks
      .filter((b) => b.format !== 'WARMUP' && b.format !== 'COOLDOWN')
      .flatMap((b) => b.exercises.map((e) => ({ ...e, block: b.title })))
      .filter((e) => (seen.has(e.exerciseId) ? false : (seen.add(e.exerciseId), true)));
  }, [workout]);

  const hasAmrap = workout.blocks.some((b) => b.format === 'AMRAP');

  const [entries, setEntries] = useState<Record<string, LogEntry>>(() =>
    Object.fromEntries(
      rows.map((r) => [
        r.exerciseId,
        { exerciseId: r.exerciseId, weight: lastWeight(sessions, r.exerciseId) ?? settings.bells[1] ?? settings.bells[0], reps: r.reps },
      ]),
    ),
  );
  const [amrapRounds, setAmrapRounds] = useState(0);
  const [note, setNote] = useState('');

  const save = () => {
    logSession({
      id: `${Date.now()}`,
      dateKey: workout.dateKey,
      dayType: workout.dayType,
      scheduled: meta.scheduled,
      flexed: meta.flexed,
      completedAt: Date.now(),
      durationSec: result.durationSec,
      entries: Object.values(entries),
      amrapRounds: hasAmrap ? amrapRounds : undefined,
      note: note.trim() || undefined,
    });
    clear();
    router.dismissTo('/');
  };

  const set = (id: string, patch: Partial<LogEntry>) => setEntries((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  const mins = Math.max(1, Math.round(result.durationSec / 60));

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Space.md, paddingTop: Space.lg }}>
        <Image source={require('@/assets/brand/logo.png')} style={{ width: 120, height: 120, borderRadius: 60 }} />
        <T variant="display" style={{ fontSize: 28, textAlign: 'center' }}>
          Moved in silence.
        </T>
        <T variant="muted" style={{ textAlign: 'center' }}>
          {DAY_LABEL[workout.dayType]} · {mins} min{meta.flexed ? ` · flexed from ${DAY_LABEL[meta.scheduled]}` : ''}
        </T>
        <Meander height={12} opacity={0.6} />
        <T style={{ fontFamily: Font.displaySemi, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>{creedForDate(workout.dateKey)}</T>
      </View>

      <T variant="label" style={{ marginTop: Space.md }}>
        Log your bells
      </T>
      {rows.map((r) => {
        const e = entries[r.exerciseId];
        return (
          <Card key={r.exerciseId}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="heading" style={{ flex: 1 }}>
                {EXERCISE_BY_ID[r.exerciseId]?.name}
              </T>
              <TextInput
                value={e.reps ?? ''}
                onChangeText={(v) => set(r.exerciseId, { reps: v })}
                placeholder="reps"
                placeholderTextColor={p.textMuted}
                style={{
                  width: 96,
                  textAlign: 'center',
                  borderWidth: 1,
                  borderColor: p.border,
                  borderRadius: Radius.sm,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  color: p.text,
                  fontFamily: Font.medium,
                }}
              />
            </Row>
            <Row style={{ flexWrap: 'wrap' }} gap={6}>
              <Chip label="BW" selected={e.weight === undefined} onPress={() => set(r.exerciseId, { weight: undefined })} />
              {settings.bells.map((b) => (
                <Chip key={b} label={`${b} ${settings.unit}`} selected={e.weight === b} onPress={() => set(r.exerciseId, { weight: b })} />
              ))}
            </Row>
          </Card>
        );
      })}

      {hasAmrap && (
        <Card>
          <T variant="label">Finisher rounds</T>
          <Row style={{ justifyContent: 'center' }} gap={Space.lg}>
            <Stepper label="−" onPress={() => setAmrapRounds((n) => Math.max(0, n - 1))} />
            <T style={{ fontFamily: Font.display, fontSize: 32, minWidth: 48, textAlign: 'center' }}>{amrapRounds}</T>
            <Stepper label="+" onPress={() => setAmrapRounds((n) => n + 1)} />
          </Row>
        </Card>
      )}

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="A private note (optional)"
        placeholderTextColor={p.textMuted}
        multiline
        style={{
          minHeight: 72,
          borderWidth: 1,
          borderColor: p.border,
          borderRadius: Radius.md,
          padding: Space.md,
          color: p.text,
          fontFamily: Font.body,
          backgroundColor: p.surface,
          textAlignVertical: 'top',
        }}
      />

      <Button title="Save quietly" onPress={save} />
    </Screen>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: p.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      <T style={{ fontSize: 24, fontFamily: Font.semibold }}>{label}</T>
    </Pressable>
  );
}

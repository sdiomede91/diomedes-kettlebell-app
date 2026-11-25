import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronIcon, ShuffleIcon } from '@/components/icons';
import { LoadSheet } from '@/components/load-sheet';
import { Meander } from '@/components/meander';
import { PreviewSheet } from '@/components/preview-sheet';
import { SelectSheet, UnitToggle } from '@/components/sheet';
import { Button, Row, T } from '@/components/ui';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { applyConfig, formatLoad, repsLabel, slotKey } from '@/engine/config';
import { DAY_LABEL, type Block } from '@/engine/types';
import { useToday } from '@/lib/use-today';
import { useActive, useStore } from '@/store';
import { dayColor, Font, Radius, Space, usePalette } from '@/theme';

const REP_OPTIONS: (number | null)[] = [null, ...Array.from({ length: 30 }, (_, i) => i + 1)];

type Open = { kind: 'reps' | 'load'; block: Block; exerciseId: string } | null;

export default function WorkoutSetup() {
  const t = useToday();
  if (!t.workout) return <Redirect href="/" />;
  return <Setup />;
}

function schemeLine(b: Block) {
  if (b.format === 'EMOM') return b.scheme.toUpperCase();
  if (b.format === 'AMRAP') return b.scheme.toUpperCase();
  const rounds = b.rounds > 1 ? `${b.rounds} ROUNDS · ` : '';
  return `${rounds}:${b.workSec} WORK${b.restSec ? ` / :${b.restSec} REST` : ''}`;
}

function Setup() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { today, workout: w, config, flexed, scheduled } = useToday();
  const workout = w!;
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const setSlot = useStore((s) => s.setSlot);
  const resetConfig = useStore((s) => s.resetConfig);
  const reshuffle = useStore((s) => s.reshuffle);
  const begin = useActive((s) => s.begin);
  const [open, setOpen] = useState<Open>(null);
  const [preview, setPreview] = useState(false);
  const tint = dayColor(workout.dayType, p);
  const unit = settings.unit;
  const owned = settings.bells[unit];

  const start = () => {
    begin(applyConfig(workout, config), { scheduled, flexed });
    router.push('/session');
  };

  const openSlot = open ? config[slotKey(open.block.id, open.exerciseId)] : undefined;
  const openEx = open ? EXERCISE_BY_ID[open.exerciseId] : undefined;
  // Movement numbers run across blocks: 1, 2, 3 …
  const firstNumber = workout.blocks.map((_, i) => workout.blocks.slice(0, i).reduce((a, b) => a + b.exercises.length, 1));

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + Space.sm, paddingBottom: 120, paddingHorizontal: Space.md, gap: Space.md, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        {/* Header */}
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={{ transform: [{ scaleX: -1 }] }}>
            <ChevronIcon size={26} color={p.text} />
          </Pressable>
          <T variant="label">Set up · {DAY_LABEL[workout.dayType]}</T>
          <UnitToggle unit={unit} onChange={(u) => update({ unit: u })} />
        </Row>

        <View style={{ gap: Space.sm }}>
          <T variant="display" style={{ fontSize: 32, lineHeight: 40 }}>
            {workout.name}
          </T>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={6}>
              <View style={{ backgroundColor: tint, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 }}>
                <T style={{ fontFamily: Font.semibold, fontSize: 13, color: p.bg }}>{DAY_LABEL[workout.dayType]}</T>
              </View>
              <View style={{ backgroundColor: p.surfaceAlt, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 }}>
                <T style={{ fontFamily: Font.semibold, fontSize: 13 }}>⏱ {Math.round(workout.totalSec / 60)} min</T>
              </View>
            </Row>
            <Row gap={Space.md}>
              <IconBtn label="Preview" onPress={() => setPreview(true)}>
                <T style={{ fontFamily: Font.semibold, fontSize: 15, color: p.text }}>ⓘ</T>
              </IconBtn>
              <IconBtn label="Reshuffle" onPress={() => reshuffle(today)}>
                <ShuffleIcon size={18} color={p.text} />
              </IconBtn>
            </Row>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="muted">Set reps and load for each movement.</T>
            <Pressable onPress={() => resetConfig(workout.id)} hitSlop={8}>
              <T variant="small" color={p.accent}>
                Reset
              </T>
            </Pressable>
          </Row>
          <Meander height={10} opacity={0.45} />
        </View>

        {workout.blocks.map((b, bi) => {
          const light = b.format === 'WARMUP' || b.format === 'COOLDOWN';
          return (
            <View key={b.id} style={{ borderWidth: 1, borderColor: p.border, borderRadius: Radius.lg, backgroundColor: p.surface, padding: Space.md, gap: Space.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={6}>
                  <View style={{ backgroundColor: p.surfaceAlt, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <T variant="label" style={{ color: p.text }}>
                      {String.fromCharCode(65 + bi)} | {b.title}
                    </T>
                  </View>
                </Row>
                <T variant="label">{schemeLine(b)}</T>
              </Row>
              {b.note ? <T variant="muted" style={{ fontSize: 13 }}>{b.note}</T> : null}
              {b.exercises.map((e, ei) => {
                const ex = EXERCISE_BY_ID[e.exerciseId];
                const c = config[slotKey(b.id, e.exerciseId)];
                const n = firstNumber[bi] + ei;
                const ld = formatLoad(c.load, unit, settings.bodyweight);
                return (
                  <View key={e.exerciseId} style={{ gap: Space.sm, paddingTop: Space.sm, borderTopWidth: 1, borderTopColor: p.border }}>
                    <Row>
                      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <T style={{ fontFamily: Font.semibold, fontSize: 12, color: p.onPrimary }}>{n}</T>
                      </View>
                      <Link href={{ pathname: '/catalog/[id]', params: { id: ex.id } }} asChild>
                        <Pressable style={{ flex: 1 }}>
                          <T style={{ fontFamily: Font.displaySemi, fontSize: 17 }}>{ex.name}</T>
                        </Pressable>
                      </Link>
                    </Row>
                    {!light && (
                      <Row gap={Space.sm} style={{ alignItems: 'flex-start' }}>
                        <Field
                          label={b.format === 'INTERVAL' ? 'Reps / round' : 'Reps'}
                          main={repsLabel(c.reps, e.reps)}
                          onPress={() => setOpen({ kind: 'reps', block: b, exerciseId: e.exerciseId })}
                        />
                        <Field label="Load" main={ld.main} sub={ld.sub} onPress={() => setOpen({ kind: 'load', block: b, exerciseId: e.exerciseId })} />
                      </Row>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Space.md, paddingTop: Space.sm, paddingBottom: insets.bottom + Space.md, backgroundColor: p.bg, borderTopWidth: 1, borderTopColor: p.border }}>
        <Button title="▶  Begin" onPress={start} style={{ maxWidth: 608, width: '100%', alignSelf: 'center' }} />
      </View>

      {open && openSlot && openEx && open.kind === 'reps' && (
        <SelectSheet
          visible
          onClose={() => setOpen(null)}
          title="Select reps"
          subtitle={`${openEx.name} · ${open.block.title}`}
          sections={[{ options: REP_OPTIONS.map((r) => ({ value: r, label: r === null ? '— (work the full interval)' : String(r) })) }]}
          isSelected={(r) => r === openSlot.reps}
          onSelect={(r) => setSlot(workout.id, workout.dateKey, slotKey(open.block.id, open.exerciseId), { ...openSlot, reps: r })}
        />
      )}
      {open && openSlot && openEx && open.kind === 'load' && (
        <LoadSheet
          visible
          onClose={() => setOpen(null)}
          exercise={openEx}
          context={open.block.title}
          value={openSlot.load}
          onChange={(l) => setSlot(workout.id, workout.dateKey, slotKey(open.block.id, open.exerciseId), { ...openSlot, load: l })}
          unit={unit}
          onUnit={(u) => update({ unit: u })}
          owned={owned}
          bodyweight={settings.bodyweight}
        />
      )}
      <PreviewSheet
        visible={preview}
        onClose={() => setPreview(false)}
        onSetUp={() => setPreview(false)}
        workout={workout}
        config={config}
        flexed={flexed}
        scheduled={scheduled}
      />
    </View>
  );
}

function Field({ label, main, sub, onPress }: { label: string; main: string; sub?: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <T variant="label" style={{ fontSize: 10 }}>
        {label}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${main}`}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 58,
          borderWidth: 1,
          borderColor: p.border,
          borderRadius: Radius.md,
          paddingHorizontal: Space.md,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: pressed ? p.surfaceAlt : p.bg,
        })}>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: Font.display, fontSize: 19 }}>{main}</T>
          {sub ? <T variant="small">{sub}</T> : null}
        </View>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <ChevronIcon size={16} color={p.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

function IconBtn({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: p.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      {children}
    </Pressable>
  );
}

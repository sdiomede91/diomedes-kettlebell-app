import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ShuffleIcon } from '@/components/icons';
import { Meander } from '@/components/meander';
import { PreviewSheet } from '@/components/preview-sheet';
import { Card, Chip, Row, Screen, T } from '@/components/ui';
import { creedForDate } from '@/data/creeds';
import { addDays, fromDateKey } from '@/engine/date';
import { scheduledDay, WEEKDAY_SHORT } from '@/engine/rotation';
import { currentStreak } from '@/engine/streak';
import { DAY_LABEL, DAY_SHORT, type DayType, type TrainingDayType } from '@/engine/types';
import { useToday } from '@/lib/use-today';
import { useHydrated, useStore } from '@/store';
import { dayColor, Font, Radius, Space, usePalette } from '@/theme';

const FLEX_OPTIONS: TrainingDayType[] = ['upper', 'lower', 'full', 'mobility'];
// The hero card stays navy-on-parchment in both themes — it echoes the logo.
const HERO_BG = '#1B2A44';
const HERO_FG = '#F1EBDD';
const HERO_MUTED = '#A9B6CC';

export default function Today() {
  const p = usePalette();
  const { today, day, scheduled, flexed, workout, config } = useToday();
  const rotation = useStore((s) => s.settings.rotation);
  const sessions = useStore((s) => s.sessions);
  const lastPreviewDate = useStore((s) => s.lastPreviewDate);
  const markPreviewed = useStore((s) => s.markPreviewed);
  const setFlex = useStore((s) => s.setFlex);
  const reshuffle = useStore((s) => s.reshuffle);
  const hydrated = useHydrated();
  const [preview, setPreview] = useState(false);

  // The preview opens by itself the first time the app is opened each day.
  const autoOpen = hydrated && !!workout && lastPreviewDate !== today;

  const closePreview = () => {
    setPreview(false);
    markPreviewed(today);
  };

  const completed = useMemo(() => new Set(sessions.map((s) => s.dateKey)), [sessions]);
  const streak = currentStreak(completed, rotation, today);
  const doneToday = completed.has(today);
  const dateLabel = fromDateKey(today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const onFlex = (d: DayType) => setFlex(today, d === scheduled ? null : d);
  const setUp = () => {
    closePreview();
    router.push('/workout');
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={Space.sm}>
          <Image source={require('@/assets/brand/logo.png')} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <T style={{ fontFamily: Font.display, fontSize: 18, letterSpacing: 3 }}>DIOMEDES</T>
        </Row>
        <View style={{ alignItems: 'flex-end' }}>
          <T variant="label">Streak</T>
          <T style={{ fontFamily: Font.display, fontSize: 20 }}>{streak}</T>
        </View>
      </Row>

      <T variant="label">{dateLabel}</T>

      {/* Hero: today's work */}
      <View style={{ backgroundColor: HERO_BG, borderRadius: Radius.lg, padding: Space.lg, gap: Space.md, overflow: 'hidden' }}>
        <Meander color={HERO_FG} opacity={0.3} height={12} />
        {workout ? (
          <>
            <View style={{ gap: 6 }}>
              <T variant="label" color={HERO_MUTED}>
                Today&apos;s work
              </T>
              <T style={{ fontFamily: Font.display, fontSize: 30, lineHeight: 38, letterSpacing: 1.5, color: HERO_FG }}>{workout.name}</T>
              <T style={{ fontFamily: Font.medium, fontSize: 14, color: HERO_MUTED }}>
                {DAY_LABEL[day]} · {Math.round(workout.totalSec / 60)} min{flexed ? ` · flexed from ${DAY_LABEL[scheduled]}` : ''}
              </T>
            </View>
            <T style={{ fontFamily: Font.displaySemi, fontSize: 15, lineHeight: 23, color: HERO_FG, opacity: 0.9 }}>{creedForDate(today)}</T>
            <Row gap={Space.sm}>
              <HeroButton title="Preview" onPress={() => setPreview(true)} />
              <HeroButton title={doneToday ? 'Train again →' : 'Set up →'} filled onPress={setUp} />
            </Row>
          </>
        ) : (
          <View style={{ gap: 6 }}>
            <T variant="label" color={HERO_MUTED}>
              Today
            </T>
            <T style={{ fontFamily: Font.display, fontSize: 30, color: HERO_FG }}>Rest</T>
            <T style={{ fontFamily: Font.body, fontSize: 15, lineHeight: 22, color: HERO_MUTED }}>
              Rest is part of the plan. Recover, walk, sleep. Your streak is safe. Flex below if you want to train.
            </T>
            <T style={{ fontFamily: Font.displaySemi, fontSize: 15, lineHeight: 23, color: HERO_FG, marginTop: Space.sm }}>{creedForDate(today)}</T>
          </View>
        )}
        <Meander color={HERO_FG} opacity={0.3} height={12} />
      </View>

      {doneToday && (
        <Card style={{ borderColor: p.accent }}>
          <T variant="heading">Done today.</T>
          <T variant="muted">No one needs to know.</T>
        </Card>
      )}

      <WeekStrip today={today} />

      <View style={{ gap: Space.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="label">Flex today</T>
          {workout && (
            <Pressable onPress={() => reshuffle(today)} accessibilityRole="button" hitSlop={10}>
              <Row gap={6}>
                <ShuffleIcon size={16} color={p.accent} />
                <T variant="small" color={p.accent}>
                  Reshuffle
                </T>
              </Row>
            </Pressable>
          )}
        </Row>
        <Row style={{ flexWrap: 'wrap' }}>
          {FLEX_OPTIONS.map((d) => (
            <Chip key={d} label={DAY_SHORT[d]} selected={day === d} color={dayColor(d, p)} onPress={() => onFlex(d)} />
          ))}
          {scheduled === 'rest' && <Chip label="Rest" selected={day === 'rest'} onPress={() => onFlex('rest')} />}
        </Row>
        <T variant="small">{flexed ? `Flexed from ${DAY_LABEL[scheduled]}. Your rotation is unchanged.` : 'Scheduled by your rotation.'}</T>
      </View>

      {workout && (
        <PreviewSheet
          visible={preview || autoOpen}
          onClose={closePreview}
          onSetUp={setUp}
          workout={workout}
          config={config}
          flexed={flexed}
          scheduled={scheduled}
        />
      )}
    </Screen>
  );
}

function HeroButton({ title, onPress, filled }: { title: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 13,
        borderRadius: Radius.pill,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: HERO_FG,
        backgroundColor: filled ? HERO_FG : 'transparent',
        opacity: pressed ? 0.75 : 1,
      })}>
      <T style={{ fontFamily: Font.semibold, fontSize: 15, letterSpacing: 0.5, color: filled ? HERO_BG : HERO_FG }}>{title}</T>
    </Pressable>
  );
}

function WeekStrip({ today }: { today: string }) {
  const p = usePalette();
  const rotation = useStore((s) => s.settings.rotation);
  const sessions = useStore((s) => s.sessions);
  const done = new Set(sessions.map((s) => s.dateKey));
  const dow = fromDateKey(today).getDay();
  const monday = addDays(today, -((dow + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      {days.map((k) => {
        const d = scheduledDay(rotation, k);
        const isToday = k === today;
        const isDone = done.has(k);
        return (
          <View key={k} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
            <T variant="small" style={{ fontSize: 11 }} color={isToday ? p.text : p.textMuted}>
              {WEEKDAY_SHORT[fromDateKey(k).getDay()]}
            </T>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: Radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDone ? dayColor(d, p) : 'transparent',
                borderWidth: isToday ? 2 : 1,
                borderColor: isToday ? p.text : dayColor(d, p),
              }}>
              <T style={{ fontFamily: Font.semibold, fontSize: 10, color: isDone ? p.bg : p.text }}>
                {DAY_SHORT[d].slice(0, d === 'mobility' ? 3 : 2).toUpperCase()}
              </T>
            </View>
          </View>
        );
      })}
    </Row>
  );
}

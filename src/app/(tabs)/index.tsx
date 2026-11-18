import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { ShuffleIcon } from '@/components/icons';
import { Meander } from '@/components/meander';
import { Button, Card, Chip, Row, Screen, T } from '@/components/ui';
import { WorkoutPreview } from '@/components/workout-preview';
import { creedForDate } from '@/data/creeds';
import { addDays, fromDateKey, todayKey } from '@/engine/date';
import { generateWorkout } from '@/engine/generate';
import { resolveDay, scheduledDay, WEEKDAY_SHORT } from '@/engine/rotation';
import { currentStreak } from '@/engine/streak';
import { DAY_LABEL, DAY_SHORT, type DayType, type TrainingDayType } from '@/engine/types';
import { useActive, useStore } from '@/store';
import { dayColor, Font, Radius, Space, usePalette } from '@/theme';

const FLEX_OPTIONS: TrainingDayType[] = ['upper', 'lower', 'full', 'mobility'];
// The creed card stays navy-on-cream in both themes — it echoes the logo.
const CREED_BG = '#1B2A44';
const CREED_FG = '#F1EBDD';

export default function Today() {
  const p = usePalette();
  const today = todayKey();
  const settings = useStore((s) => s.settings);
  const flexOverrides = useStore((s) => s.flexOverrides);
  const shuffle = useStore((s) => s.shuffles[today] ?? 0);
  const sessions = useStore((s) => s.sessions);
  const setFlex = useStore((s) => s.setFlex);
  const reshuffle = useStore((s) => s.reshuffle);
  const begin = useActive((s) => s.begin);

  const { day, scheduled, flexed } = resolveDay(settings.rotation, flexOverrides, today);
  const workout = useMemo(
    () =>
      day === 'rest'
        ? null
        : generateWorkout({ dateKey: today, dayType: day, minutes: settings.minutes, maxLevel: settings.maxLevel, shuffle }),
    [day, today, settings.minutes, settings.maxLevel, shuffle],
  );

  const completed = useMemo(() => new Set(sessions.map((s) => s.dateKey)), [sessions]);
  const streak = currentStreak(completed, settings.rotation, today);
  const doneToday = completed.has(today);

  const date = fromDateKey(today);
  const dateLabel = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const onFlex = (d: DayType) => setFlex(today, d === scheduled ? null : d);

  const start = () => {
    if (!workout) return;
    begin(workout, { scheduled, flexed });
    router.push('/session');
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

      <Card style={{ backgroundColor: CREED_BG, borderColor: p.border, gap: Space.md, paddingVertical: Space.lg }}>
        <Meander color={CREED_FG} opacity={0.35} height={12} />
        <T style={{ fontFamily: Font.displaySemi, fontSize: 18, lineHeight: 27, color: CREED_FG, textAlign: 'center' }}>
          {creedForDate(today)}
        </T>
        <Meander color={CREED_FG} opacity={0.35} height={12} />
      </Card>

      <View style={{ gap: 4 }}>
        <T variant="label">{dateLabel}</T>
        <T variant="display" style={{ fontSize: 30 }}>
          {DAY_LABEL[day]}
        </T>
        <T variant="muted">
          {flexed ? `Flexed from ${DAY_LABEL[scheduled]}. Rotation unchanged.` : 'Scheduled by your rotation.'}
          {workout ? `  ·  ${Math.round(workout.totalSec / 60)} min` : ''}
        </T>
      </View>

      <WeekStrip today={today} />

      <View style={{ gap: Space.sm }}>
        <T variant="label">Flex today</T>
        <Row style={{ flexWrap: 'wrap' }}>
          {FLEX_OPTIONS.map((d) => (
            <Chip key={d} label={DAY_SHORT[d]} selected={day === d} color={dayColor(d, p)} onPress={() => onFlex(d)} />
          ))}
          {scheduled === 'rest' && <Chip label="Rest" selected={day === 'rest'} onPress={() => onFlex('rest')} />}
        </Row>
      </View>

      {doneToday && (
        <Card style={{ borderColor: p.accent }}>
          <T variant="heading">Done today.</T>
          <T variant="muted">No one needs to know. You can train again if you want to.</T>
        </Card>
      )}

      {workout ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="label">The work</T>
            <Pressable onPress={() => reshuffle(today)} accessibilityRole="button" hitSlop={10}>
              <Row gap={6}>
                <ShuffleIcon size={16} color={p.accent} />
                <T variant="small" color={p.accent}>
                  Reshuffle
                </T>
              </Row>
            </Pressable>
          </Row>
          <WorkoutPreview workout={workout} />
          <Button title={doneToday ? 'Train again' : 'Begin'} onPress={start} style={{ marginTop: Space.sm }} />
        </>
      ) : (
        <Card style={{ alignItems: 'center', paddingVertical: Space.xl }}>
          <T variant="title">Rest</T>
          <T variant="muted" style={{ textAlign: 'center' }}>
            Rest is part of the plan. Recover, walk, sleep. Your streak is safe. Flex into a session above if you want to.
          </T>
        </Card>
      )}
    </Screen>
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

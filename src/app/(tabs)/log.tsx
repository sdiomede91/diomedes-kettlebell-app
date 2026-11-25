import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ChevronIcon } from '@/components/icons';
import { Button, Card, Row, Screen, T } from '@/components/ui';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { fromDateKey, todayKey, toDateKey } from '@/engine/date';
import { currentStreak, longestStreak } from '@/engine/streak';
import { DAY_LABEL } from '@/engine/types';
import { convert, roundWeight } from '@/engine/config';
import { useStore, type SessionLog } from '@/store';
import { dayColor, Font, Radius, Space, usePalette } from '@/theme';

export default function Log() {
  const p = usePalette();
  const sessions = useStore((s) => s.sessions);
  const rotation = useStore((s) => s.settings.rotation);
  const unit = useStore((s) => s.settings.unit);
  const today = todayKey();

  const completed = useMemo(() => new Set(sessions.map((s) => s.dateKey)), [sessions]);
  const streak = currentStreak(completed, rotation, today);
  const best = longestStreak(completed, rotation);
  const totalMin = Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60);

  const heaviest = useMemo(() => {
    const m = new Map<string, { max: number; last: number; count: number }>();
    // sessions are newest-first
    for (const s of sessions)
      for (const e of s.entries) {
        if (e.weight === undefined) continue;
        const w = roundWeight(convert(e.weight, e.unit ?? unit, unit));
        const cur = m.get(e.exerciseId);
        if (!cur) m.set(e.exerciseId, { max: w, last: w, count: 1 });
        else m.set(e.exerciseId, { ...cur, max: Math.max(cur.max, w), count: cur.count + 1 });
      }
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  }, [sessions, unit]);

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <T variant="display" style={{ fontSize: 28 }}>
          Log
        </T>
        <T variant="muted">Private. Seen by no one but you.</T>
      </View>

      <Row gap={Space.sm}>
        <Stat label="Streak" value={streak} />
        <Stat label="Longest" value={best} />
        <Stat label="Sessions" value={sessions.length} />
        <Stat label="Minutes" value={totalMin} />
      </Row>

      <Calendar sessions={sessions} />

      {heaviest.length > 0 && (
        <Card>
          <T variant="label">Your bells</T>
          {heaviest.map(([id, v]) => (
            <Row key={id} style={{ justifyContent: 'space-between' }}>
              <T style={{ flex: 1 }}>{EXERCISE_BY_ID[id]?.name ?? id}</T>
              <T variant="muted">
                last {v.last} · best{' '}
                <T style={{ fontFamily: Font.semibold }}>
                  {v.max} {unit}
                </T>
              </T>
            </Row>
          ))}
        </Card>
      )}

      <T variant="label">History</T>
      {sessions.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: Space.xl }}>
          <T variant="muted" style={{ textAlign: 'center' }}>
            Nothing yet. The first session is the hardest one to start.
          </T>
        </Card>
      ) : (
        sessions.slice(0, 50).map((s) => <SessionRow key={s.id} s={s} />)
      )}

      <View style={{ height: Space.md }} />
      <T variant="small" style={{ textAlign: 'center' }} color={p.textMuted}>
        Scheduled rest days never break your streak.
      </T>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const p = usePalette();
  return (
    <View style={{ flex: 1, backgroundColor: p.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: p.border, paddingVertical: Space.md, alignItems: 'center', gap: 2 }}>
      <T style={{ fontFamily: Font.display, fontSize: 24 }}>{value}</T>
      <T variant="label" style={{ fontSize: 10 }}>
        {label}
      </T>
    </View>
  );
}

function Calendar({ sessions }: { sessions: SessionLog[] }) {
  const p = usePalette();
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const byDate = new Map<string, SessionLog>();
  for (const s of sessions) if (!byDate.has(s.dateKey)) byDate.set(s.dateKey, s);
  const lead = (month.getDay() + 6) % 7; // Monday-first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => toDateKey(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];
  while (cells.length % 7) cells.push(null);
  const today = todayKey();

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable accessibilityLabel="Previous month" onPress={() => setOffset((o) => o - 1)} hitSlop={10} style={{ transform: [{ scaleX: -1 }] }}>
          <ChevronIcon color={p.text} />
        </Pressable>
        <T variant="heading" style={{ fontFamily: Font.displaySemi }}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </T>
        <Pressable accessibilityLabel="Next month" onPress={() => setOffset((o) => Math.min(0, o + 1))} hitSlop={10} style={{ opacity: offset === 0 ? 0.3 : 1 }}>
          <ChevronIcon color={p.text} />
        </Pressable>
      </Row>
      <Row gap={0}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <T key={i} variant="small" style={{ flex: 1, textAlign: 'center' }}>
            {d}
          </T>
        ))}
      </Row>
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <Row key={w} gap={0}>
          {cells.slice(w * 7, w * 7 + 7).map((k, i) => {
            const s = k ? byDate.get(k) : undefined;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 3 }}>
                {k && (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: s ? dayColor(s.dayType, p) : 'transparent',
                      borderWidth: k === today ? 1.5 : 0,
                      borderColor: p.text,
                    }}>
                    <T style={{ fontSize: 12, fontFamily: Font.medium, color: s ? p.bg : fromDateKey(k) > now ? p.border : p.textMuted }}>
                      {fromDateKey(k).getDate()}
                    </T>
                  </View>
                )}
              </View>
            );
          })}
        </Row>
      ))}
      <Row style={{ flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }} gap={Space.md}>
        {(['upper', 'lower', 'full', 'mobility'] as const).map((d) => (
          <Row key={d} gap={4}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dayColor(d, p) }} />
            <T variant="small">{DAY_LABEL[d].split(' ')[0]}</T>
          </Row>
        ))}
      </Row>
    </Card>
  );
}

function SessionRow({ s }: { s: SessionLog }) {
  const p = usePalette();
  const unit = useStore((st) => st.settings.unit);
  const del = useStore((st) => st.deleteSession);
  const [open, setOpen] = useState(false);
  const date = fromDateKey(s.dateKey).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <Pressable onPress={() => setOpen((o) => !o)}>
      <Card style={{ borderLeftWidth: 4, borderLeftColor: dayColor(s.dayType, p) }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="heading">{DAY_LABEL[s.dayType]}</T>
          <T variant="small">{date}</T>
        </Row>
        <T variant="small">
          {Math.round(s.durationSec / 60)} min
          {s.flexed ? ` · flexed from ${DAY_LABEL[s.scheduled]}` : ''}
          {s.amrapRounds !== undefined ? ` · ${s.amrapRounds} finisher rounds` : ''}
        </T>
        {open && (
          <View style={{ gap: 4, marginTop: 4 }}>
            {s.entries.map((e) => (
              <Row key={e.exerciseId} style={{ justifyContent: 'space-between' }}>
                <T variant="muted">{EXERCISE_BY_ID[e.exerciseId]?.name}</T>
                <T variant="muted">
                  {e.weight !== undefined ? `${roundWeight(convert(e.weight, e.unit ?? unit, unit))} ${unit}` : 'BW'}
                  {e.reps ? ` × ${e.reps}` : ''}
                </T>
              </Row>
            ))}
            {s.note ? <T style={{ fontStyle: 'italic' }}>“{s.note}”</T> : null}
            <Button title="Delete entry" kind="danger" onPress={() => del(s.id)} style={{ marginTop: Space.sm, paddingVertical: 8 }} />
          </View>
        )}
      </Card>
    </Pressable>
  );
}

import { Redirect, router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseVideo } from '@/components/exercise-video';
import { CloseIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from '@/components/icons';
import { TimerRing } from '@/components/timer-ring';
import { Button, Row, T } from '@/components/ui';
import { EXERCISE_BY_ID, EXERCISES } from '@/data/exercises';
import {
  advance,
  back,
  buildTimeline,
  elapsedSec,
  pause,
  remainingMs,
  resume,
  skip,
  startTimer,
  timelineDuration,
  type Phase,
  type TimerState,
} from '@/engine/timer';
import { useCues } from '@/lib/cues';
import { useActive, useStore } from '@/store';
import { Font, Radius, Space, usePalette } from '@/theme';

const UNILATERAL = new Set(EXERCISES.filter((e) => e.unilateral).map((e) => e.id));

function fmt(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Session() {
  const workout = useActive((s) => s.workout);
  if (!workout) return <Redirect href="/" />;
  return <Player />;
}

function useScreenAwake() {
  useEffect(() => {
    const tag = 'diomedes-session';
    let active = false;
    activateKeepAwakeAsync(tag)
      .then(() => (active = true))
      .catch(() => {});
    return () => {
      if (active) deactivateKeepAwake(tag).catch(() => {});
    };
  }, []);
}

function Player() {
  useScreenAwake();
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const workout = useActive((s) => s.workout)!;
  const finish = useActive((s) => s.finish);
  const settings = useStore((s) => s.settings);
  const cue = useCues({ sound: settings.sound, haptics: settings.haptics });

  const phases = useMemo(() => buildTimeline(workout, UNILATERAL), [workout]);
  const total = useMemo(() => timelineDuration(phases), [phases]);

  const [state, setState] = useState<TimerState>(() => startTimer(Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const [confirmExit, setConfirmExit] = useState(false);

  // Tick
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState((s) => advance(s, phases, t));
    }, 200);
    return () => clearInterval(id);
  }, [phases]);

  // Cues
  const prev = useRef({ index: -1, sec: -1, switched: false });
  const rem = remainingMs(state, phases, now);
  const phase = phases[state.index];
  const sec = Math.ceil(rem / 1000);

  useEffect(() => {
    if (state.done) return;
    const r = prev.current;
    if (r.index !== state.index) {
      if (r.index !== -1) cue(phase.kind === 'work' ? 'go' : 'rest');
      prev.current = { index: state.index, sec, switched: false };
      return;
    }
    if (sec !== r.sec) {
      if (sec <= 3 && sec >= 1 && state.pausedAt === null) cue('tick');
      if (phase.switchSides && !r.switched && sec <= Math.floor(phase.durationSec / 2)) {
        cue('switch');
        r.switched = true;
      }
      r.sec = sec;
    }
  }, [state.index, sec, state.done, state.pausedAt, phase, cue]);

  // Done
  useEffect(() => {
    if (!state.done) return;
    cue('done');
    finish(elapsedSec(state, phases, Date.now()));
    router.replace('/complete');
  }, [state.done]); // eslint-disable-line react-hooks/exhaustive-deps

  const paused = state.pausedAt !== null;
  const progress = 1 - rem / (phase.durationSec * 1000);
  const elapsedTotal = elapsedSec(state, phases, now);

  // During rest / get-ready, show the movement that's coming so the user can set up.
  const showIdx = phase.kind === 'work' ? state.index : nextWorkIndex(phases, state.index);
  const showId = showIdx >= 0 ? phases[showIdx].exerciseIds[0] : undefined;
  const ex = showId ? EXERCISE_BY_ID[showId] : undefined;
  const upNextIdx = showIdx >= 0 ? nextWorkIndex(phases, showIdx + 1) : -1;
  const upNext = upNextIdx >= 0 ? phases[upNextIdx] : undefined;
  const ringColor = phase.kind === 'work' ? p.work : phase.kind === 'rest' ? p.rest : p.accent;
  const ringSize = Math.min(width - Space.xl * 2, height * 0.3, 280);

  const kindLabel = phase.kind === 'work' ? 'Work' : phase.kind === 'rest' ? 'Rest' : 'Get ready';
  const amrap = workout.blocks[phase.blockIndex]?.format === 'AMRAP' && phase.kind === 'work';

  return (
    <View style={{ flex: 1, backgroundColor: p.bg, paddingTop: insets.top + Space.sm, paddingBottom: insets.bottom + Space.md }}>
      <View style={{ flex: 1, paddingHorizontal: Space.md, gap: Space.md, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        {/* Top bar */}
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable accessibilityLabel="End session" onPress={() => setConfirmExit(true)} hitSlop={12}>
            <CloseIcon color={p.text} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <T variant="label">{phase.blockTitle}</T>
            <T variant="small">{phase.label}</T>
          </View>
          <T variant="small" style={{ minWidth: 44, textAlign: 'right' }}>
            {fmt((total - elapsedTotal) * 1000)}
          </T>
        </Row>
        <View style={{ height: 3, backgroundColor: p.border, borderRadius: 2 }}>
          <View style={{ height: 3, width: `${(elapsedTotal / total) * 100}%`, backgroundColor: p.accent, borderRadius: 2 }} />
        </View>

        {/* Movement */}
        {showId && <ExerciseVideo exerciseId={showId} style={{ maxHeight: height * 0.28 }} />}

        {amrap ? (
          <View style={{ gap: 2 }}>
            <T variant="label">Each round</T>
            {phase.exerciseIds.map((id, i) => (
              <T key={id} variant="heading">
                {workout.blocks[phase.blockIndex].exercises[i].reps} · {EXERCISE_BY_ID[id].name}
              </T>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 2 }}>
            <T variant="label">{phase.kind === 'work' ? kindLabel : `${kindLabel} · next up`}</T>
            <T variant="title" style={{ textAlign: 'center' }}>
              {ex?.name ?? ''}
            </T>
            {phase.kind === 'work' && (phase.reps || phase.switchSides) && (
              <T variant="muted">
                {phase.reps ? `${phase.reps}${/\d$/.test(phase.reps) ? ' reps' : ''}` : ''}
                {phase.switchSides ? `${phase.reps ? ' · ' : ''}switch sides at the beep` : ''}
              </T>
            )}
          </View>
        )}

        {/* Countdown */}
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <TimerRing size={ringSize} progress={progress} color={ringColor}>
            <T style={{ fontFamily: Font.display, fontSize: ringSize * 0.26, lineHeight: ringSize * 0.32, color: p.text }}>{fmt(rem)}</T>
            <T variant="label" color={ringColor}>
              {paused ? 'Paused' : kindLabel}
            </T>
          </TimerRing>
        </View>

        {upNext && (
          <T variant="muted" style={{ textAlign: 'center' }}>
            Next: {EXERCISE_BY_ID[upNext.exerciseIds[0]]?.name}
            {upNext.reps ? ` · ${upNext.reps}` : ''}
          </T>
        )}

        {/* Controls */}
        <Row style={{ justifyContent: 'center' }} gap={Space.xl}>
          <RoundButton label="Previous" onPress={() => setState((s) => back(s, Date.now()))}>
            <PrevIcon color={p.text} />
          </RoundButton>
          <RoundButton
            big
            label={paused ? 'Resume' : 'Pause'}
            onPress={() => setState((s) => (s.pausedAt === null ? pause(s, Date.now()) : resume(s, Date.now())))}>
            {paused ? <PlayIcon color={p.onPrimary} size={30} /> : <PauseIcon color={p.onPrimary} size={30} />}
          </RoundButton>
          <RoundButton label="Skip" onPress={() => setState((s) => skip(s, phases, Date.now()))}>
            <NextIcon color={p.text} />
          </RoundButton>
        </Row>
      </View>

      {confirmExit && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(8,12,20,0.6)',
            justifyContent: 'center',
            padding: Space.lg,
          }}>
          <View style={{ backgroundColor: p.surface, borderRadius: Radius.lg, padding: Space.lg, gap: Space.md, maxWidth: 420, width: '100%', alignSelf: 'center' }}>
            <T variant="title">End session?</T>
            <T variant="muted">You can log what you did so far, or leave without saving.</T>
            <Button
              title="Finish & log"
              onPress={() => {
                finish(elapsedSec(state, phases, Date.now()));
                router.replace('/complete');
              }}
            />
            <Button
              title="Discard"
              kind="danger"
              onPress={() => {
                useActive.getState().clear();
                router.back();
              }}
            />
            <Button title="Keep going" kind="ghost" onPress={() => setConfirmExit(false)} />
          </View>
        </View>
      )}
    </View>
  );
}

function nextWorkIndex(phases: Phase[], from: number): number {
  for (let i = Math.max(0, from); i < phases.length; i++) if (phases[i].kind === 'work') return i;
  return -1;
}

function RoundButton({ children, onPress, big, label }: { children: React.ReactNode; onPress: () => void; big?: boolean; label: string }) {
  const p = usePalette();
  const size = big ? 76 : 54;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: big ? p.primary : p.surfaceAlt,
        opacity: pressed ? 0.7 : 1,
      })}>
      {children}
    </Pressable>
  );
}

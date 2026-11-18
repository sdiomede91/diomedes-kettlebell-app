import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { EXERCISE_BY_ID } from '@/data/exercises';
import type { Workout } from '@/engine/types';
import { Space, usePalette } from '@/theme';

import { ExerciseVideo } from './exercise-video';
import { ChevronIcon } from './icons';
import { Card, Row, T } from './ui';

export function WorkoutPreview({ workout }: { workout: Workout }) {
  const p = usePalette();
  return (
    <View style={{ gap: Space.sm }}>
      {workout.blocks.map((b, i) => (
        <Card key={b.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="label">
              {String.fromCharCode(65 + i)} · {b.title}
            </T>
            <T variant="small">{b.scheme}</T>
          </Row>
          {b.exercises.map((e, j) => {
            const ex = EXERCISE_BY_ID[e.exerciseId];
            return (
              <Link key={`${e.exerciseId}-${j}`} href={{ pathname: '/catalog/[id]', params: { id: e.exerciseId } }} asChild>
                <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                  <Row gap={Space.md}>
                    <ExerciseVideo exerciseId={e.exerciseId} compact style={{ width: 64, aspectRatio: 1, borderRadius: 10 }} />
                    <View style={{ flex: 1 }}>
                      <T variant="heading" style={{ fontSize: 15 }}>
                        {ex?.name}
                      </T>
                      <T variant="small">{e.reps ? `${e.reps} reps`.replace(/s reps$/, 's') : `${b.workSec}s`}</T>
                    </View>
                    <ChevronIcon color={p.textMuted} />
                  </Row>
                </Pressable>
              </Link>
            );
          })}
          {b.note ? (
            <T variant="muted" style={{ fontStyle: 'italic', fontSize: 13 }}>
              {b.note}
            </T>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

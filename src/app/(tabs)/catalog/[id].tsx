import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ExerciseVideo } from '@/components/exercise-video';
import { Card, Row, Screen, T } from '@/components/ui';
import { EXERCISE_BY_ID, PATTERN_LABEL } from '@/data/exercises';
import { convert, roundWeight } from '@/engine/config';
import { useStore } from '@/store';
import { Radius, Space, usePalette } from '@/theme';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePalette();
  const e = EXERCISE_BY_ID[id];
  const sessions = useStore((s) => s.sessions);
  const unit = useStore((s) => s.settings.unit);

  if (!e) {
    return (
      <Screen>
        <T variant="title">Not found</T>
      </Screen>
    );
  }

  const history = sessions
    .flatMap((s) => s.entries.filter((x) => x.exerciseId === e.id && x.weight !== undefined).map((x) => ({ date: s.dateKey, weight: roundWeight(convert(x.weight!, x.unit ?? unit, unit)), reps: x.reps })))
    .slice(0, 8);

  const tags = [PATTERN_LABEL[e.pattern], ...e.focus.map((f) => f[0].toUpperCase() + f.slice(1)), e.level, e.unilateral ? 'Single side' : 'Bilateral'];

  return (
    <Screen style={{ paddingTop: Space.sm }}>
      <Stack.Screen options={{ title: e.name }} />
      <ExerciseVideo exerciseId={e.id} />
      <T variant="title">{e.name}</T>
      <Row style={{ flexWrap: 'wrap' }} gap={6}>
        {tags.map((t) => (
          <View key={t} style={{ backgroundColor: p.accentSoft, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
            <T variant="small" color={p.text} style={{ textTransform: 'capitalize' }}>
              {t}
            </T>
          </View>
        ))}
      </Row>
      <T>{e.summary}</T>

      <Card>
        <T variant="label">Cues</T>
        {e.cues.map((c) => (
          <Row key={c} style={{ alignItems: 'flex-start' }}>
            <T color={p.accent}>—</T>
            <T style={{ flex: 1 }}>{c}</T>
          </Row>
        ))}
      </Card>

      <Card>
        <T variant="label">Common mistakes</T>
        {e.mistakes.map((c) => (
          <Row key={c} style={{ alignItems: 'flex-start' }}>
            <T color={p.danger}>×</T>
            <T style={{ flex: 1 }}>{c}</T>
          </Row>
        ))}
      </Card>

      {history.length > 0 && (
        <Card>
          <T variant="label">Your recent work</T>
          {history.map((h, i) => (
            <Row key={i} style={{ justifyContent: 'space-between' }}>
              <T variant="muted">{h.date}</T>
              <T>
                {h.weight} {unit}
                {h.reps ? ` × ${h.reps}` : ''}
              </T>
            </Row>
          ))}
        </Card>
      )}
    </Screen>
  );
}

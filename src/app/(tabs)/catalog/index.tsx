import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ExerciseVideo } from '@/components/exercise-video';
import { ChevronIcon } from '@/components/icons';
import { Card, Chip, Row, Screen, T } from '@/components/ui';
import { EXERCISES, PATTERN_LABEL, type Focus, type Level, type Pattern } from '@/data/exercises';
import { videoFor } from '@/data/videos';
import { Font, Radius, Space, usePalette } from '@/theme';

const FOCI: (Focus | 'all')[] = ['all', 'upper', 'lower', 'full'];
const LEVELS: Level[] = ['base', 'intermediate', 'advanced'];

export default function Catalog() {
  const p = usePalette();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState<Focus | 'all'>('all');
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [level, setLevel] = useState<Level | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXERCISES.filter(
      (e) =>
        (focus === 'all' || e.focus.includes(focus)) &&
        (!pattern || e.pattern === pattern) &&
        (!level || e.level === level) &&
        (!needle || e.name.toLowerCase().includes(needle) || e.pattern.includes(needle)),
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [q, focus, pattern, level]);

  const filmed = EXERCISES.filter((e) => videoFor(e.id) !== undefined).length;

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <T variant="display" style={{ fontSize: 28 }}>
          Catalog
        </T>
        <T variant="muted">
          {EXERCISES.length} movements · {filmed} filmed
        </T>
      </View>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search movements"
        placeholderTextColor={p.textMuted}
        style={{
          backgroundColor: p.surface,
          borderColor: p.border,
          borderWidth: 1,
          borderRadius: Radius.pill,
          paddingHorizontal: Space.md,
          paddingVertical: 12,
          fontFamily: Font.body,
          fontSize: 15,
          color: p.text,
        }}
      />

      <Row style={{ flexWrap: 'wrap' }}>
        {FOCI.map((f) => (
          <Chip key={f} label={f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)} selected={focus === f} onPress={() => setFocus(f)} />
        ))}
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        {(Object.keys(PATTERN_LABEL) as Pattern[]).map((pt) => (
          <Chip key={pt} label={PATTERN_LABEL[pt]} selected={pattern === pt} onPress={() => setPattern(pattern === pt ? null : pt)} />
        ))}
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        {LEVELS.map((l) => (
          <Chip key={l} label={l[0].toUpperCase() + l.slice(1)} selected={level === l} onPress={() => setLevel(level === l ? null : l)} />
        ))}
      </Row>

      <View style={{ gap: Space.sm }}>
        {list.map((e) => (
          <Link key={e.id} href={{ pathname: '/catalog/[id]', params: { id: e.id } }} asChild>
            <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.sm }}>
                <ExerciseVideo exerciseId={e.id} compact style={{ width: 72, aspectRatio: 1, borderRadius: 10 }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T variant="heading" style={{ fontSize: 16 }}>
                    {e.name}
                  </T>
                  <T variant="small">
                    {PATTERN_LABEL[e.pattern]} · {e.focus.map((f) => f[0].toUpperCase() + f.slice(1)).join(' / ')} · {e.level}
                  </T>
                </View>
                <ChevronIcon color={p.textMuted} />
              </Card>
            </Pressable>
          </Link>
        ))}
        {list.length === 0 && <T variant="muted">Nothing matches. Clear a filter.</T>}
      </View>
    </Screen>
  );
}

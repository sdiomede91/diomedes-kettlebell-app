import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { videoFor, type VideoSource } from '@/data/videos';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { Font, Radius, usePalette } from '@/theme';

import { KettlebellIcon } from './icons';
import { Meander } from './meander';
import { T } from './ui';

type Props = { exerciseId: string; style?: StyleProp<ViewStyle>; compact?: boolean };

/** Looping, muted movement demo. Falls back to a branded placeholder until a video is added. */
export function ExerciseVideo({ exerciseId, style, compact }: Props) {
  const src = videoFor(exerciseId);
  return (
    <View style={[styles.frame, style]}>
      {src !== undefined ? <Player key={exerciseId} source={src} /> : <Placeholder exerciseId={exerciseId} compact={compact} />}
    </View>
  );
}

function Player({ source }: { source: VideoSource }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

function Placeholder({ exerciseId, compact }: { exerciseId: string; compact?: boolean }) {
  const p = usePalette();
  const name = EXERCISE_BY_ID[exerciseId]?.name ?? exerciseId;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
      <View style={{ position: 'absolute', top: 8, left: 8, right: 8 }}>
        <Meander height={10} opacity={0.5} />
      </View>
      <View style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
        <Meander height={10} opacity={0.5} />
      </View>
      <KettlebellIcon size={compact ? 28 : 44} color={p.accent} />
      {!compact && (
        <>
          <T variant="heading" style={{ fontFamily: Font.displaySemi, letterSpacing: 1 }}>
            {name}
          </T>
          <T variant="label">Film coming</T>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 10, borderRadius: Radius.md, overflow: 'hidden' },
});

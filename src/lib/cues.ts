import { useAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export type Cue = 'tick' | 'go' | 'switch' | 'rest' | 'done';

/** Audio + haptic cues for the session player. */
export function useCues(opts: { sound: boolean; haptics: boolean }) {
  const tick = useAudioPlayer(require('@/assets/sounds/tick.wav'));
  const go = useAudioPlayer(require('@/assets/sounds/go.wav'));
  const gong = useAudioPlayer(require('@/assets/sounds/gong.wav'));

  useEffect(() => {
    // Play over silent mode and mix with the user's music.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  const play = (pl: AudioPlayer) => {
    try {
      pl.seekTo(0);
      pl.play();
    } catch {}
  };

  const buzz = (kind: 'light' | 'heavy' | 'success') => {
    if (!opts.haptics || Platform.OS === 'web') return;
    const run =
      kind === 'success'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    run.catch(() => {});
  };

  return (cue: Cue) => {
    if (opts.sound) {
      if (cue === 'tick' || cue === 'switch') play(tick);
      else if (cue === 'go' || cue === 'rest') play(go);
      else if (cue === 'done') play(gong);
    }
    buzz(cue === 'done' ? 'success' : cue === 'go' || cue === 'switch' ? 'heavy' : 'light');
  };
}

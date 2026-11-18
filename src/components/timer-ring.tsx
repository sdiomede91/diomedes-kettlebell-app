import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { usePalette } from '@/theme';

export function TimerRing({
  size,
  progress,
  color,
  children,
}: {
  size: number;
  /** 0 → 1 elapsed fraction */
  progress: number;
  color: string;
  children?: React.ReactNode;
}) {
  const p = usePalette();
  const stroke = Math.max(6, size * 0.045);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * Math.min(1, Math.max(0, progress))}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

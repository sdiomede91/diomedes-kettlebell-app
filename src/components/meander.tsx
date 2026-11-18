import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { usePalette } from '@/theme';

/** A thin Greek-key (meander) band that fills its width. */
export function Meander({ height = 14, color, opacity = 1 }: { height?: number; color?: string; opacity?: number }) {
  const p = usePalette();
  const [w, setW] = useState(0);
  const unit = height; // one key per `height` px
  const count = Math.ceil(w / unit) + 1;
  const s = height / 10;

  // One key motif in a 10×10 box, drawn as a single stroke.
  const key = (x: number) =>
    `M${x} ${9 * s} H${x + 9 * s} V${1 * s} H${x + 2 * s} V${7 * s} H${x + 6 * s} V${4 * s} H${x + 4.5 * s} M${x + 9 * s} ${9 * s} H${x + 10 * s}`;

  return (
    <View style={{ height, width: '100%', opacity }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Path
            d={Array.from({ length: count }, (_, i) => key(i * unit)).join(' ')}
            stroke={color ?? p.accent}
            strokeWidth={Math.max(1, s * 1.1)}
            fill="none"
            strokeLinecap="square"
          />
        </Svg>
      )}
    </View>
  );
}

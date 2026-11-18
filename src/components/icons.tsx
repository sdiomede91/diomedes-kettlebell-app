import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { size?: number; color: ColorValue };

export function KettlebellIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 9V6.5a4 4 0 0 1 8 0V9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={6.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function GridIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={3.5} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
      <Rect x={13.5} y={13.5} width={7} height={7} rx={1.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function LogIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15.5} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function GearIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      <Path
        d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PlayIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4.5v15l12-7.5z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={6} y={4.5} width={4} height={15} rx={1} fill={color} />
      <Rect x={14} y={4.5} width={4} height={15} rx={1} fill={color} />
    </Svg>
  );
}

export function NextIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 5v14l10-7z" fill={color} />
      <Rect x={16} y={5} width={3} height={14} rx={1} fill={color} />
    </Svg>
  );
}

export function PrevIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 5v14L9 12z" fill={color} />
      <Rect x={5} y={5} width={3} height={14} rx={1} fill={color} />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function ShuffleIcon({ size = 24, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6C14.3 16 15.5 17 17.5 17H21M3 17h3.5c1.4 0 2.4-.5 3.2-1.4M14.3 8.4c.8-.9 1.8-1.4 3.2-1.4H21M18 4l3 3-3 3M18 14l3 3-3 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronIcon({ size = 18, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 5 7 7-7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

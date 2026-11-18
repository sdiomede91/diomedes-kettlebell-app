import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Radius, Space, usePalette } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'muted' | 'label' | 'small';

export function T({ variant = 'body', style, color, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  const p = usePalette();
  const base: Record<Variant, TextStyle> = {
    display: { fontFamily: Font.display, fontSize: 34, letterSpacing: 2, color: p.text },
    title: { fontFamily: Font.display, fontSize: 24, letterSpacing: 1.2, color: p.text },
    heading: { fontFamily: Font.semibold, fontSize: 17, color: p.text },
    body: { fontFamily: Font.body, fontSize: 15, lineHeight: 22, color: p.text },
    muted: { fontFamily: Font.body, fontSize: 14, lineHeight: 20, color: p.textMuted },
    label: { fontFamily: Font.semibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: p.textMuted },
    small: { fontFamily: Font.medium, fontSize: 12, color: p.textMuted },
  };
  return <Text {...rest} style={[base[variant], color ? { color } : null, style]} />;
}

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const inner = (
    <View style={[{ paddingTop: insets.top + Space.md, paddingHorizontal: Space.md, paddingBottom: Space.xl, gap: Space.md, maxWidth: 640, width: '100%', alignSelf: 'center' }, style]}>
      {children}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{inner}</ScrollView> : inner}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return (
    <View style={[{ backgroundColor: p.surface, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: p.border, padding: Space.md, gap: Space.sm }, style]}>
      {children}
    </View>
  );
}

export function Button({
  title,
  kind = 'primary',
  style,
  icon,
  ...rest
}: PressableProps & { title: string; kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; style?: StyleProp<ViewStyle>; icon?: ReactNode }) {
  const p = usePalette();
  const bg = kind === 'primary' ? p.primary : kind === 'secondary' ? p.surfaceAlt : 'transparent';
  const fg = kind === 'primary' ? p.onPrimary : kind === 'danger' ? p.danger : p.text;
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: Radius.pill,
          paddingVertical: 14,
          paddingHorizontal: Space.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Space.sm,
          opacity: pressed ? 0.75 : rest.disabled ? 0.4 : 1,
          borderWidth: kind === 'ghost' || kind === 'danger' ? 1 : 0,
          borderColor: kind === 'danger' ? p.danger : p.border,
        },
        style,
      ]}>
      {icon}
      <Text style={{ color: fg, fontFamily: Font.semibold, fontSize: 15, letterSpacing: 0.5 }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
  small,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  small?: boolean;
}) {
  const p = usePalette();
  const tint = color ?? p.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: small ? 6 : 8,
        paddingHorizontal: small ? 0 : 14,
        flexGrow: small ? 1 : 0,
        flexBasis: small ? 0 : 'auto',
        alignItems: 'center',
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: selected ? tint : p.border,
        backgroundColor: selected ? tint : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}>
      <Text numberOfLines={1} style={{ fontFamily: Font.semibold, fontSize: small ? 12 : 13, color: selected ? p.bg : p.text }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style, gap = Space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  const p = usePalette();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: p.border }} />;
}

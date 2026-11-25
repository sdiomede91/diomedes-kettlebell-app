import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { WeightUnit } from '@/data/bells';
import { Font, Radius, Space, usePalette } from '@/theme';

import { CloseIcon } from './icons';
import { Row, T } from './ui';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Rendered under the title, above the scroll area (e.g. a unit toggle). */
  header?: ReactNode;
  /** Pinned to the bottom (e.g. action buttons). */
  footer?: ReactNode;
  children: ReactNode;
  /** Max height as a fraction of the screen. */
  maxHeight?: number;
};

/** Bottom sheet: dimmed backdrop, handle bar, centered title, close ×. */
export function Sheet({ visible, onClose, title, subtitle, header, footer, children, maxHeight = 0.85 }: SheetProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [slide] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      slide.setValue(1);
      Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  }, [visible, slide]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,12,20,0.55)' }} />
        <Animated.View
          style={{
            maxHeight: height * maxHeight,
            backgroundColor: p.bg,
            borderTopLeftRadius: Radius.lg + 6,
            borderTopRightRadius: Radius.lg + 6,
            paddingBottom: insets.bottom + Space.md,
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
            transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.6] }) }],
          }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: p.border }} />
          </View>
          <View style={{ paddingHorizontal: Space.md, paddingTop: Space.sm, paddingBottom: Space.sm, alignItems: 'center' }}>
            <T style={{ fontFamily: Font.displaySemi, fontSize: 17, letterSpacing: 1.2, textAlign: 'center', paddingHorizontal: 40 }}>{title}</T>
            {subtitle ? (
              <T variant="small" style={{ textAlign: 'center', marginTop: 2 }}>
                {subtitle}
              </T>
            ) : null}
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={onClose}
              hitSlop={12}
              style={{ position: 'absolute', right: Space.md, top: Space.sm }}>
              <CloseIcon color={p.text} />
            </Pressable>
          </View>
          {header ? <View style={{ paddingHorizontal: Space.md, paddingBottom: Space.sm, alignItems: 'center' }}>{header}</View> : null}
          <View style={{ height: 1, backgroundColor: p.border, marginHorizontal: Space.md }} />
          {children}
          {footer ? <View style={{ paddingHorizontal: Space.md, paddingTop: Space.sm, gap: Space.sm }}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

export type SelectOption<T> = { value: T; label: string; detail?: string; starred?: boolean };
export type SelectSection<T> = { title?: string; options: SelectOption<T>[] };

const ROW_H = 54;
const HEAD_H = 34;

/** A picker in a bottom sheet: list of options, ✓ on the selected one, opens scrolled to it. */
export function SelectSheet<T>({
  visible,
  onClose,
  title,
  subtitle,
  header,
  sections,
  isSelected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  header?: ReactNode;
  sections: SelectSection<T>[];
  isSelected: (v: T) => boolean;
  onSelect: (v: T) => void;
}) {
  const p = usePalette();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Offset of the selected row, so the list opens with it in view.
  let y = 0;
  let target = 0;
  for (const s of sections) {
    if (s.title) y += HEAD_H;
    for (const o of s.options) {
      if (isSelected(o.value) && !target) target = y;
      y += ROW_H;
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={title} subtitle={subtitle} header={header}>
      <ScrollView
        ref={scroll}
        onLayout={() => scroll.current?.scrollTo({ y: Math.max(0, target - ROW_H * 2), animated: false })}
        contentContainerStyle={{ paddingBottom: Space.md }}>
        {sections.map((s, si) => (
          <View key={si}>
            {s.title ? (
              <View style={{ height: HEAD_H, justifyContent: 'flex-end', paddingHorizontal: Space.md, paddingBottom: 4 }}>
                <T variant="label">{s.title}</T>
              </View>
            ) : null}
            {s.options.map((o, oi) => {
              const sel = isSelected(o.value);
              return (
                <Pressable
                  key={oi}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  onPress={() => {
                    onSelect(o.value);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    height: ROW_H,
                    paddingHorizontal: Space.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: sel ? p.accentSoft : pressed ? p.surfaceAlt : 'transparent',
                  })}>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontFamily: sel ? Font.semibold : Font.body, fontSize: 16 }}>{o.label}</T>
                  </View>
                  {o.detail ? (
                    <T variant="small" style={{ marginRight: Space.md }}>
                      {o.detail}
                    </T>
                  ) : null}
                  {sel ? (
                    <T style={{ fontSize: 18, color: p.text }}>✓</T>
                  ) : o.starred ? (
                    <T style={{ fontSize: 16, color: p.accent }}>★</T>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

/** KG | LB segmented toggle. */
export function UnitToggle({ unit, onChange }: { unit: WeightUnit; onChange: (u: WeightUnit) => void }) {
  const p = usePalette();
  return (
    <Row gap={0} style={{ borderWidth: 1, borderColor: p.border, borderRadius: Radius.pill, padding: 3, backgroundColor: p.surface }}>
      {(['kg', 'lb'] as WeightUnit[]).map((u) => {
        const on = unit === u;
        return (
          <Pressable
            key={u}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={u === 'kg' ? 'Kilograms' : 'Pounds'}
            onPress={() => onChange(u)}
            style={{ paddingVertical: 6, paddingHorizontal: 18, borderRadius: Radius.pill, backgroundColor: on ? p.primary : 'transparent' }}>
            <T style={{ fontFamily: Font.semibold, fontSize: 13, letterSpacing: 1, color: on ? p.onPrimary : p.textMuted }}>{u.toUpperCase()}</T>
          </Pressable>
        );
      })}
    </Row>
  );
}

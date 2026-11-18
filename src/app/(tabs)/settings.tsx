import { useState } from 'react';
import { Pressable, Switch } from 'react-native';

import { Meander } from '@/components/meander';
import { Button, Card, Chip, Divider, Row, Screen, T } from '@/components/ui';
import type { Level } from '@/data/exercises';
import { exportBackup, importBackup } from '@/lib/backup';
import { syncReminder } from '@/lib/reminder';
import { DEFAULT_ROTATION, WEEKDAY_SHORT } from '@/engine/rotation';
import { DAY_SHORT, type DayType, type Rotation, type SessionLength } from '@/engine/types';
import { useStore, type WeightUnit } from '@/store';
import { dayColor, Font, Space, usePalette } from '@/theme';

const DAY_TYPES: DayType[] = ['upper', 'lower', 'full', 'mobility', 'rest'];
const BELLS: Record<WeightUnit, number[]> = {
  kg: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48],
  lb: [10, 15, 20, 25, 30, 35, 40, 45, 50, 53, 60, 70, 80, 90, 106],
};
// Monday-first display order (index into Rotation, 0 = Sunday)
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function Settings() {
  const p = usePalette();
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const setRotationDay = (i: number, d: DayType) => {
    const r = [...settings.rotation] as Rotation;
    r[i] = d;
    update({ rotation: r });
  };

  const toggleBell = (b: number) => {
    const has = settings.bells.includes(b);
    const bells = has ? settings.bells.filter((x) => x !== b) : [...settings.bells, b].sort((a, c) => a - c);
    if (bells.length) update({ bells });
  };

  const setReminder = async (patch: Partial<typeof settings.reminder>) => {
    const reminder = { ...settings.reminder, ...patch };
    update({ reminder });
    try {
      const ok = await syncReminder(reminder);
      if (!ok) {
        update({ reminder: { ...reminder, enabled: false } });
        setMsg('Notifications are off for Diomedes. Enable them in system settings.');
      }
    } catch {
      setMsg('Could not schedule the reminder on this device.');
    }
  };

  const changeUnit = (unit: WeightUnit) => {
    if (unit === settings.unit) return;
    update({ unit, bells: unit === 'kg' ? [12, 16, 20, 24] : [25, 35, 45, 53] });
  };

  return (
    <Screen>
      <T variant="display" style={{ fontSize: 28 }}>
        Settings
      </T>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="label">Weekly rotation</T>
          <Pressable onPress={() => update({ rotation: DEFAULT_ROTATION })} hitSlop={8}>
            <T variant="small" color={p.accent}>
              Reset
            </T>
          </Pressable>
        </Row>
        <T variant="muted">Your standard week. You can always flex on the day itself.</T>
        {ORDER.map((i) => (
          <Row key={i} gap={4} style={{ paddingVertical: 2 }}>
            <T variant="heading" style={{ fontSize: 13, width: 36 }}>
              {WEEKDAY_SHORT[i]}
            </T>
            {DAY_TYPES.map((d) => (
              <Chip
                key={d}
                small
                label={d === 'mobility' ? 'Mob' : DAY_SHORT[d]}
                selected={settings.rotation[i] === d}
                color={dayColor(d, p)}
                onPress={() => setRotationDay(i, d)}
              />
            ))}
          </Row>
        ))}
      </Card>

      <Card>
        <T variant="label">Session length</T>
        <Row>
          {([20, 30, 45] as SessionLength[]).map((m) => (
            <Chip key={m} label={`${m} min`} selected={settings.minutes === m} onPress={() => update({ minutes: m })} />
          ))}
        </Row>
        <Divider />
        <T variant="label">Movement level</T>
        <T variant="muted">The generator only picks movements at or below this level.</T>
        <Row style={{ flexWrap: 'wrap' }}>
          {(['base', 'intermediate', 'advanced'] as Level[]).map((l) => (
            <Chip key={l} label={l[0].toUpperCase() + l.slice(1)} selected={settings.maxLevel === l} onPress={() => update({ maxLevel: l })} />
          ))}
        </Row>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="label">Your bells</T>
          <Row gap={6}>
            {(['kg', 'lb'] as WeightUnit[]).map((u) => (
              <Chip key={u} label={u} selected={settings.unit === u} onPress={() => changeUnit(u)} />
            ))}
          </Row>
        </Row>
        <T variant="muted">The bells you own. Used for quick logging.</T>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          {BELLS[settings.unit].map((b) => (
            <Chip key={b} label={`${b}`} selected={settings.bells.includes(b)} onPress={() => toggleBell(b)} />
          ))}
        </Row>
      </Card>

      <Card>
        <ToggleRow label="Sound cues" value={settings.sound} onChange={(v) => update({ sound: v })} />
        <Divider />
        <ToggleRow label="Haptics" value={settings.haptics} onChange={(v) => update({ haptics: v })} />
        <Divider />
        <ToggleRow label="Daily reminder" value={settings.reminder.enabled} onChange={(v) => setReminder({ enabled: v })} />
        {settings.reminder.enabled && (
          <Row style={{ justifyContent: 'center', paddingVertical: Space.sm }} gap={Space.md}>
            <Step label="−" onPress={() => setReminder(shift(settings.reminder, -15))} />
            <T style={{ fontFamily: Font.display, fontSize: 26, minWidth: 110, textAlign: 'center' }}>
              {String(settings.reminder.hour).padStart(2, '0')}:{String(settings.reminder.minute).padStart(2, '0')}
            </T>
            <Step label="+" onPress={() => setReminder(shift(settings.reminder, 15))} />
          </Row>
        )}
      </Card>

      <Card>
        <T variant="label">Your data</T>
        <T variant="muted">Everything lives on this device. No account, no cloud. Back it up yourself.</T>
        <Row>
          <Button title="Export" kind="secondary" style={{ flex: 1 }} onPress={() => exportBackup().catch((e) => setMsg(String(e?.message ?? e)))} />
          <Button
            title="Import"
            kind="secondary"
            style={{ flex: 1 }}
            onPress={() =>
              importBackup()
                .then(setMsg)
                .catch(() => setMsg('Could not read that file.'))
            }
          />
        </Row>
        {confirmReset ? (
          <Row>
            <Button
              title="Erase everything"
              kind="danger"
              style={{ flex: 1 }}
              onPress={() => {
                resetAll();
                setConfirmReset(false);
                setMsg('All data erased.');
              }}
            />
            <Button title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
          </Row>
        ) : (
          <Button title="Reset all data" kind="ghost" onPress={() => setConfirmReset(true)} />
        )}
        {msg && <T variant="small">{msg}</T>}
      </Card>

      <Card style={{ gap: Space.md }}>
        <Meander height={12} opacity={0.6} />
        <T variant="title" style={{ textAlign: 'center' }}>
          Why Diomedes
        </T>
        <T>
          While Achilles sulked in his tent, Diomedes carried the war. He wounded Ares and Aphrodite, served as the muscle to Odysseus’s
          brains, and sailed home without drama. Disciplined, loyal, respectful, and almost forgotten.
        </T>
        <T>He never needed the spotlight. Neither do you. Move in silence. Be consistent. Let the work speak.</T>
        <Meander height={12} opacity={0.6} />
      </Card>
    </Screen>
  );
}

function shift(r: { hour: number; minute: number }, mins: number) {
  const t = (((r.hour * 60 + r.minute + mins) % 1440) + 1440) % 1440;
  return { hour: Math.floor(t / 60), minute: t % 60 };
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const p = usePalette();
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <T variant="heading" style={{ fontSize: 15 }}>
        {label}
      </T>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: p.accent, false: p.border }} thumbColor={p.surface} />
    </Row>
  );
}

function Step({ label, onPress }: { label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <T style={{ fontSize: 22, fontFamily: Font.semibold }}>{label}</T>
    </Pressable>
  );
}

import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { CREEDS } from '@/data/creeds';

/** Schedules (or clears) the daily training reminder. Returns false if permission was denied. */
export async function syncReminder(r: { enabled: boolean; hour: number; minute: number }): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!r.enabled) return true;

  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily reminder',
      importance: AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Diomedes',
      body: CREEDS[Math.floor(Math.random() * CREEDS.length)],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: r.hour,
      minute: r.minute,
      channelId: 'daily',
    },
  });
  return true;
}

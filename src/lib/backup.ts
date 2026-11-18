import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { exportData, useStore, type ExportShape } from '@/store';

export async function exportBackup(): Promise<void> {
  const json = JSON.stringify(exportData(), null, 2);
  const name = `diomedes-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save Diomedes backup' });
}

/** Returns a message describing the result. */
export async function importBackup(): Promise<string> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled) return 'Import cancelled.';
  const asset = res.assets[0];
  const text = Platform.OS === 'web' ? await fetch(asset.uri).then((r) => r.text()) : await new File(asset.uri).text();
  const data = JSON.parse(text) as ExportShape;
  if (data?.app !== 'diomedes' || !Array.isArray(data.sessions)) return 'That file is not a Diomedes backup.';
  useStore.getState().importData(data);
  return `Restored ${data.sessions.length} sessions.`;
}

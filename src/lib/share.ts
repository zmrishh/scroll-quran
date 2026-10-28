import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Alert, Platform, type HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** Renders the card to a PNG and opens the system share sheet. */
export async function shareCard(ref: RefObject<HostInstance | null>, prepare?: (on: boolean) => void) {
  if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
    Alert.alert('Sharing', 'Open the app on your phone to share cards as images.');
    return;
  }
  try {
    prepare?.(true);
    await nextFrame();
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    prepare?.(false);
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share this card' });
  } catch {
    prepare?.(false);
  }
}

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useApp } from '@/store/app-store';

const enabled = () => Platform.OS !== 'web' && useApp.getState().haptics;

export const haptic = {
  tap: () => enabled() && Haptics.selectionAsync().catch(() => {}),
  soft: () => enabled() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}),
  medium: () => enabled() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () =>
    enabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  error: () =>
    enabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};

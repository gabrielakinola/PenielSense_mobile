import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export function useHaptics() {
  const light = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  const medium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  }, []);

  const selection = useCallback(() => {
    Haptics.selectionAsync().catch(() => undefined);
  }, []);

  const success = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
  }, []);

  return { light, medium, selection, success };
}

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useServices } from '../../app/ServicesContext';

/**
 * Blocks screenshots and screen recording while a screen holding personal
 * details is focused (FLAG_SECURE on Android, a secure shield on iOS).
 */
export function useScreenCaptureProtection(): void {
  const { deviceSecurity } = useServices();
  useFocusEffect(
    useCallback(() => {
      deviceSecurity.setScreenCaptureProtection(true);
      return () => deviceSecurity.setScreenCaptureProtection(false);
    }, [deviceSecurity]),
  );
}

import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';

export interface RemoteImageProps {
  /** Raw value from the API; resolved and vetted by MediaUrlResolver. */
  source: string | null | undefined;
  /** Width / height. */
  aspectRatio?: number;
  resizeMode?: ImageResizeMode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Image from API content. Unsafe or missing URLs render a neutral placeholder. */
export function RemoteImage({
  source,
  aspectRatio,
  resizeMode = 'cover',
  accessibilityLabel,
  style,
}: RemoteImageProps) {
  const { media } = useServices();
  const styles = useThemedStyles(createStyles);
  const [failed, setFailed] = useState(false);
  const uri = media.resolve(source);
  const frame = [styles.frame, aspectRatio ? { aspectRatio } : null, style];

  if (!uri || failed) {
    return (
      <View
        style={frame}
        accessibilityLabel={accessibilityLabel}
        accessible={!!accessibilityLabel}
      />
    );
  }
  return (
    <View style={frame}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        onError={() => setFailed(true)}
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    frame: {
      width: '100%',
      backgroundColor: t.colors.skeleton,
      overflow: 'hidden',
    },
  });

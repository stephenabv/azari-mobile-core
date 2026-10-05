import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { Shimmer } from '../../ui/motion';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

export interface ProjectImageProps {
  /** Raw value from the API; resolved and vetted by MediaUrlResolver. */
  source: string | null | undefined;
  /** Width / height. */
  aspectRatio: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Project photo with a shimmering placeholder until the image has loaded.
 * Missing, unsafe or broken URLs keep the neutral placeholder (no shimmer).
 */
export function ProjectImage({
  source,
  aspectRatio,
  accessibilityLabel,
  style,
}: ProjectImageProps) {
  const { media } = useServices();
  const styles = useThemedStyles(createStyles);
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const uri = media.resolve(source);
  const showImage = !!uri && !failed;

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  return (
    <View
      style={[styles.frame, { aspectRatio }, style]}
      onLayout={onLayout}
      accessible={!!accessibilityLabel && !showImage}
      accessibilityLabel={showImage ? undefined : accessibilityLabel}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          accessible={!!accessibilityLabel}
          accessibilityLabel={accessibilityLabel}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {showImage && !loaded && width > 0 ? (
        <Shimmer width={width} style={[styles.sweep, { width: width / 2 }]} />
      ) : null}
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
    sweep: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: t.dark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.5)',
    },
  });

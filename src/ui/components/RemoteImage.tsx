import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type ImageResizeMode,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { LogoLoader } from '../brand/LogoLoader';
import { MOTION } from '../motion/tokens';
import { useReducedMotion } from '../motion/useReducedMotion';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';

/** Loader size relative to the frame, clamped so it reads on any tile. */
const LOADER_SHARE = 0.24;
const LOADER_MIN = 28;
const LOADER_MAX = 72;

export function imageLoaderWidth(frameWidth: number): number {
  return Math.round(
    Math.min(LOADER_MAX, Math.max(LOADER_MIN, frameWidth * LOADER_SHARE)),
  );
}

export interface RemoteImageProps {
  /** Raw value from the API; resolved and vetted by MediaUrlResolver. */
  source: string | null | undefined;
  /** Width / height. */
  aspectRatio?: number;
  resizeMode?: ImageResizeMode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Image from API content. While it downloads the frame plays the website's
 * logo loader, then the photo fades in over it. Unsafe, missing or broken
 * URLs keep a neutral placeholder without the loader.
 */
export function RemoteImage({
  source,
  aspectRatio,
  resizeMode = 'cover',
  accessibilityLabel,
  style,
}: RemoteImageProps) {
  const { media } = useServices();
  const styles = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [frameWidth, setFrameWidth] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const uri = media.resolve(source);
  const showImage = !!uri && !failed;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    fade.setValue(0);
  }, [uri, fade]);

  const onLoad = () => {
    setLoaded(true);
    Animated.timing(fade, {
      toValue: 1,
      duration: reduced ? 0 : MOTION.duration.base,
      easing: MOTION.easing.out,
      useNativeDriver: true,
    }).start();
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next !== frameWidth) setFrameWidth(next);
  };

  return (
    <View
      style={[styles.frame, aspectRatio ? { aspectRatio } : null, style]}
      onLayout={onLayout}
      accessible={!!accessibilityLabel && !showImage}
      accessibilityLabel={showImage ? undefined : accessibilityLabel}
    >
      {showImage && !loaded && frameWidth > 0 ? (
        <View style={styles.center} pointerEvents="none">
          <LogoLoader
            width={imageLoaderWidth(frameWidth)}
            testID="image-loader"
          />
        </View>
      ) : null}
      {showImage ? (
        <Animated.Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { opacity: fade }]}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onError={() => setFailed(true)}
          accessible={!!accessibilityLabel}
          accessibilityLabel={accessibilityLabel}
          accessibilityIgnoresInvertColors
        />
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
    center: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

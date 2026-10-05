import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { FONTS, type Theme } from '../theme/theme';
import { AppText } from './AppText';

const HEIGHT = 22;
/** Depth of the V-notch cut into the banner's tail. */
const NOTCH = 9;

export interface RibbonBadgeProps {
  label: string;
  /** Distance from the top of the clipping container. */
  top?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Flat banner fixed to the left edge of a card with a notched (swallowtail)
 * end, e.g. "Recommended". Place it inside a container with overflow hidden.
 */
export function RibbonBadge({ label, top = 12, style }: RibbonBadgeProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View
      pointerEvents="none"
      style={[styles.ribbon, { top }, style]}
      accessible
      accessibilityLabel={label}
    >
      <View style={styles.body}>
        <AppText style={styles.text} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <Svg width={NOTCH} height={HEIGHT} viewBox={`0 0 ${NOTCH} ${HEIGHT}`}>
        <Polygon
          points={`0,0 ${NOTCH},0 0,${
            HEIGHT / 2
          } ${NOTCH},${HEIGHT} 0,${HEIGHT}`}
          fill={theme.colors.sun}
        />
      </Svg>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    ribbon: {
      position: 'absolute',
      left: 0,
      zIndex: 2,
      flexDirection: 'row',
      height: HEIGHT,
    },
    body: {
      height: HEIGHT,
      justifyContent: 'center',
      paddingLeft: t.spacing(2.5),
      paddingRight: t.spacing(1),
      backgroundColor: t.colors.sun,
    },
    text: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.3,
      color: '#0A0A0A',
    },
  });

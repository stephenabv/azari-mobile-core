import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../ui/icons';
import { MOTION } from '../ui/motion';
import { useReducedMotion } from '../ui/motion/useReducedMotion';
import { useThemedStyles } from '../ui/theme/ThemeContext';
import type { Theme } from '../ui/theme/theme';
import type { TabParamList } from './types';

export const TAB_ICONS: Record<keyof TabParamList, IconName> = {
  Home: 'home',
  Packages: 'bag',
  Calculator: 'calculator',
  Projects: 'image',
  More: 'menu',
};

const BAR_HEIGHT = 64;
const BAR_MARGIN = 16;
const HIGHLIGHT = 48;
const BAR_PADDING = 8;

/** Space a tab screen leaves at the bottom so content clears the bar. */
export function floatingTabBarClearance(bottomInset: number): number {
  return BAR_HEIGHT + BAR_MARGIN + Math.max(bottomInset, 8) + 16;
}

/**
 * Icon-only floating tab bar. A translucent coral disc slides to the active
 * tab; each button keeps its route name as the accessibility label. Slots are
 * measured on the inner row (inside the bar's padding), so the disc is
 * centred on every icon at any width.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [slotWidth, setSlotWidth] = useState(0);
  const position = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    if (reduced) {
      position.setValue(state.index);
      return;
    }
    Animated.spring(position, {
      toValue: state.index,
      ...MOTION.spring.settle,
      useNativeDriver: true,
    }).start();
  }, [position, state.index, reduced]);

  const onLayout = (event: LayoutChangeEvent) =>
    setSlotWidth(event.nativeEvent.layout.width / state.routes.length);

  const translateX = Animated.multiply(position, slotWidth);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 8) + 8 }]}
    >
      <View style={styles.bar} accessibilityRole="tablist">
        <View style={styles.row} onLayout={onLayout}>
          {slotWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.highlight,
                {
                  left: (slotWidth - HIGHLIGHT) / 2,
                  transform: [{ translateX }],
                },
              ]}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const options = descriptors[route.key]?.options ?? {};
            const label =
              options.tabBarAccessibilityLabel ?? options.title ?? route.name;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };
            const onLongPress = () =>
              navigation.emit({ type: 'tabLongPress', target: route.key });
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: focused }}
                testID={options.tabBarButtonTestID}
                style={styles.slot}
                hitSlop={4}
              >
                <Icon
                  name={TAB_ICONS[route.name as keyof TabParamList] ?? 'menu'}
                  size={22}
                  strokeWidth={focused ? 2.2 : 1.9}
                  color={focused ? styles.iconActive.color : styles.icon.color}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: BAR_MARGIN,
      right: BAR_MARGIN,
      alignItems: 'center',
    },
    bar: {
      width: '100%',
      maxWidth: 520,
      height: BAR_HEIGHT,
      borderRadius: BAR_HEIGHT / 2,
      backgroundColor: t.dark ? 'rgba(22,22,22,0.92)' : t.colors.night,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.dark ? '#262626' : t.colors.night,
      justifyContent: 'center',
      paddingHorizontal: BAR_PADDING,
      shadowColor: '#000000',
      shadowOpacity: 0.3,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    row: { flexDirection: 'row', alignItems: 'center', height: HIGHLIGHT },
    highlight: {
      position: 'absolute',
      top: 0,
      width: HIGHLIGHT,
      height: HIGHLIGHT,
      borderRadius: HIGHLIGHT / 2,
      backgroundColor: t.colors.tabHighlight,
    },
    slot: {
      flex: 1,
      height: HIGHLIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: { color: t.colors.onNightMuted },
    iconActive: { color: t.colors.onNight },
  });

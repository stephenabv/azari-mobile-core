import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  PanResponder,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useServices } from '../../app/ServicesContext';
import type { RootScreenProps } from '../../navigation/types';
import { AppText, Button } from '../../ui/components';

const MAX_SCALE = 4;

const touchDistance = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return a && b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0;
};

/**
 * One photo with pinch-to-zoom, pan while zoomed and double-tap to toggle zoom.
 * Built on PanResponder so no gesture library is needed.
 */
function ZoomableImage({
  uri,
  width,
  height,
  onZoomChange,
}: {
  uri: string;
  width: number;
  height: number;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.ValueXY()).current;
  const state = useRef({
    scale: 1,
    x: 0,
    y: 0,
    startScale: 1,
    startDistance: 0,
    lastTap: 0,
  });

  const commit = useCallback(
    (nextScale: number, x: number, y: number) => {
      const s = state.current;
      s.scale = nextScale;
      const maxX = ((nextScale - 1) * width) / 2;
      const maxY = ((nextScale - 1) * height) / 2;
      s.x = Math.max(-maxX, Math.min(maxX, x));
      s.y = Math.max(-maxY, Math.min(maxY, y));
      scale.setValue(nextScale);
      translate.setValue({ x: s.x, y: s.y });
      onZoomChange(nextScale > 1.01);
    },
    [width, height, scale, translate, onZoomChange],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Let the pager handle horizontal swipes unless zoomed or pinching.
        onStartShouldSetPanResponder: e =>
          e.nativeEvent.touches.length === 2 || state.current.scale > 1,
        onMoveShouldSetPanResponder: e =>
          e.nativeEvent.touches.length === 2 || state.current.scale > 1,
        onPanResponderGrant: e => {
          const s = state.current;
          s.startScale = s.scale;
          s.startDistance = touchDistance(e);
          const now = Date.now();
          if (e.nativeEvent.touches.length === 1 && now - s.lastTap < 280)
            commit(s.scale > 1 ? 1 : 2.5, 0, 0);
          s.lastTap = now;
        },
        onPanResponderMove: (e, g) => {
          const s = state.current;
          if (e.nativeEvent.touches.length === 2) {
            const d = touchDistance(e);
            if (!s.startDistance) s.startDistance = d;
            const next = Math.max(
              1,
              Math.min(MAX_SCALE, (s.startScale * d) / (s.startDistance || d)),
            );
            commit(next, s.x, s.y);
          } else if (s.scale > 1) {
            translate.setValue({ x: s.x + g.dx, y: s.y + g.dy });
          }
        },
        onPanResponderRelease: (_e, g) => {
          const s = state.current;
          if (s.scale > 1) commit(s.scale, s.x + g.dx, s.y + g.dy);
          else commit(1, 0, 0);
        },
        onPanResponderTerminationRequest: () => state.current.scale <= 1,
      }),
    [commit, translate],
  );

  return (
    <View style={{ width, height }} {...responder.panHandlers}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              { translateX: translate.x },
              { translateY: translate.y },
              { scale },
            ],
          },
        ]}
      >
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

export function PhotoViewerScreen({
  navigation,
  route,
}: RootScreenProps<'PhotoViewer'>) {
  const { media } = useServices();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const images = useMemo(
    () => media.resolveAll(route.params.images),
    [media, route.params.images],
  );
  const start = Math.min(
    Math.max(0, route.params.index),
    Math.max(0, images.length - 1),
  );
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);

  const onViewable = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ReadonlyArray<{ index?: number | null }>;
    }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  const renderItem: ListRenderItem<string> = ({ item }) => (
    <ZoomableImage
      uri={item}
      width={width}
      height={height}
      onZoomChange={setZoomed}
    />
  );

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={images}
        keyExtractor={uri => uri}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled={!zoomed}
        initialScrollIndex={start}
        getItemLayout={(_d, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        // Remount on rotation so pages keep the new width.
        key={`${width}x${height}`}
      />
      <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <AppText variant="label" style={styles.light} numberOfLines={1}>
          {`${route.params.title ? `${route.params.title} · ` : ''}${
            index + 1
          } / ${images.length}`}
        </AppText>
        <Button
          label="Close"
          variant="ghost"
          compact
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  light: { color: '#FFFFFF', flex: 1 },
});

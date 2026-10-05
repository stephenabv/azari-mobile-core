import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { SocialPlatform } from '../../domain/social/SocialPlatform';
import { Icon } from '../icons';

export interface SocialLogoProps {
  platform: SocialPlatform | null;
  /** Tile size; the logo is drawn at about half of it. */
  size?: number;
  /** Colour for the generic globe when the platform is unknown. */
  fallbackColor: string;
  /** Tile colour when the platform has none of its own. */
  fallbackTile: string;
}

/** A platform's logo on a rounded tile, or a globe for unknown sites. */
export function SocialLogo({
  platform,
  size = 38,
  fallbackColor,
  fallbackTile,
}: SocialLogoProps) {
  const glyph = Math.round(size * 0.5);
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: platform?.tileColor ?? fallbackTile,
        },
      ]}
    >
      {platform ? (
        <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
          <Path
            d={platform.logo}
            fill={platform.brandColor}
            fillRule="evenodd"
          />
        </Svg>
      ) : (
        <Icon name="globe" size={glyph} color={fallbackColor} strokeWidth={2} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});

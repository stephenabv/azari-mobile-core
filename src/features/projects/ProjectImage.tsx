import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { RemoteImage } from '../../ui/components';

export interface ProjectImageProps {
  /** Raw value from the API; resolved and vetted by MediaUrlResolver. */
  source: string | null | undefined;
  /** Width / height. */
  aspectRatio: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Project photo. Shares RemoteImage's behaviour: the logo loader plays until
 * the photo arrives; missing, unsafe or broken URLs keep a still placeholder.
 */
export function ProjectImage(props: ProjectImageProps) {
  return <RemoteImage {...props} />;
}

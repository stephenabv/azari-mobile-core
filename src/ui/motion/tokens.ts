import { Easing } from 'react-native';

/** Shared timing so every screen moves with the same rhythm. */
export const MOTION = Object.freeze({
  duration: { fast: 160, base: 320, slow: 560, splash: 900 },
  /** Delay added per item in a staggered list. */
  stagger: 60,
  /** Cap so long lists never wait noticeably for their last item. */
  maxStaggerItems: 8,
  easing: {
    out: Easing.bezier(0.2, 0.8, 0.2, 1),
    inOut: Easing.inOut(Easing.cubic),
  },
  spring: {
    press: { speed: 40, bounciness: 0 },
    settle: { speed: 14, bounciness: 6 },
  },
  pressScale: 0.96,
});

export function staggerDelay(index: number): number {
  return Math.min(index, MOTION.maxStaggerItems) * MOTION.stagger;
}

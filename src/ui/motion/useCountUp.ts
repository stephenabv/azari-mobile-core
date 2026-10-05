import { useEffect, useRef, useState } from 'react';
import { MOTION } from './tokens';
import { useReducedMotion } from './useReducedMotion';

/**
 * Animates a number from its previous value to `target` with an ease-out
 * curve. Returns the current frame's value; callers format it.
 */
export function useCountUp(
  target: number,
  duration: number = MOTION.duration.slow * 2.5,
): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (reduced || !Number.isFinite(target)) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return value;
}

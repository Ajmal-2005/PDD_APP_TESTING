'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Charts are drawn in real pixel coordinates rather than a stretched viewBox:
 * `preserveAspectRatio="none"` would scale glyphs and strokes non-uniformly,
 * smearing every axis label. Measuring costs one observer and keeps text crisp.
 */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

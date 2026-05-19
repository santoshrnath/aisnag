"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** ms */ durationMs?: number;
  format?: (n: number) => string;
}

// Count-up from 0 to `value` on first paint. Cheap rAF, no library.
export function AnimatedNumber({
  value,
  durationMs = 700,
  format = (n) => String(n),
}: Props) {
  const [n, setN] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    let raf = 0;
    const step = (t: number) => {
      if (start.current == null) start.current = t;
      const elapsed = t - start.current;
      const k = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{format(n)}</>;
}

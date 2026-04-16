import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export default function AnimatedCounter({
  value,
  duration = 700,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return undefined;

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setDisplay(from + delta * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return <span className={className}>{format(display)}</span>;
}

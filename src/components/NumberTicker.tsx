import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  className?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

export function NumberTicker({ value, className, prefix = "", decimals = 0, duration = 700 }: Props) {
  const [display, setDisplay] = useState(value);
  const startVal = useRef(value);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    startVal.current = display;
    startTime.current = null;
    const target = value;
    const animate = (ts: number) => {
      if (startTime.current === null) startTime.current = ts;
      const t = Math.min(1, (ts - startTime.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startVal.current + (target - startVal.current) * eased;
      setDisplay(next);
      if (t < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

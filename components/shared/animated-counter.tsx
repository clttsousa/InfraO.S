"use client";

import { useEffect, useMemo, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export function AnimatedCounter({ value, duration = 650, prefix = "", suffix = "", className = "" }: AnimatedCounterProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const from = displayValue;
    const delta = safeValue - from;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + delta * eased));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, safeValue]);

  const formatted = useMemo(() => `${prefix}${displayValue.toLocaleString("pt-BR")}${suffix}`, [displayValue, prefix, suffix]);

  return <span className={className}>{formatted}</span>;
}

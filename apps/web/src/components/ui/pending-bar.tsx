'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

interface PendingBarProps {
  /** What is happening, e.g. "Writing the post". */
  message: string;
  /** Suffix for the live seconds counter, e.g. "s elapsed". */
  elapsedSuffix: string;
  /** Shown after the wait has run long, so a stall does not look like success. */
  slowNotice?: string;
  /** Seconds before the slow notice appears. */
  slowAfterSeconds?: number;
}

/**
 * Progress feedback for a running form action.
 *
 * The bar is deliberately indeterminate — it sweeps rather than fills to a
 * percentage. Nothing in this stack reports real progress: the request is a
 * single call to Gemini or Meta that either returns or does not, so any
 * percentage would be invented, and an invented bar that sticks at 90% is worse
 * than an honest one that keeps moving.
 *
 * The seconds counter beside it is real, and it is the part that actually tells
 * a waiting person whether this run is normal or stuck.
 */
export function PendingBar({
  message,
  elapsedSuffix,
  slowNotice,
  slowAfterSeconds = 25,
}: PendingBarProps) {
  const { pending } = useFormStatus();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!pending) return;

    // Every write happens inside the interval callback. Setting state directly
    // in the effect body would run synchronously during the effect and cascade
    // renders, and reading a ref or the clock during render is not allowed
    // either — so the tick is the only place that touches either.
    //
    // 250ms rather than 1000ms: the displayed value is whole seconds, but a
    // faster tick means a new run cannot briefly show the previous run's count.
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => clearInterval(timer);
  }, [pending]);

  if (!pending) return null;

  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-label={`${message} — ${elapsed}${elapsedSuffix}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-text-secondary">{message}</span>
        <span className="text-xs tabular-nums text-text-muted">
          {elapsed}
          {elapsedSuffix}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-raised">
        <div className="animate-indeterminate h-full w-1/3 rounded-full bg-accent" />
      </div>

      {slowNotice && elapsed >= slowAfterSeconds ? (
        <p className="text-xs text-text-muted">{slowNotice}</p>
      ) : null}
    </div>
  );
}

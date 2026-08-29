'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GenerationPollerProps {
  message: string;
  elapsedSuffix: string;
  stuckMessage: string;
  /**
   * The server-side pipeline gives up on itself after 130s (see
   * `processCreativeEngineV2`'s deadline race in generate-image) and writes
   * a FAILED status — this waits a bit past that so the last refresh has a
   * real status to pick up, rather than silently freezing mid-count the way
   * an earlier version did.
   */
  giveUpAfterSeconds?: number;
}

/**
 * Creative Engine V2 finishes in the background after the page that
 * triggered it has already redirected back — this is what notices the
 * result landing. It polls by re-running the server component (which
 * re-reads `creative_runs`) rather than a dedicated status endpoint, since
 * the page render is already the source of truth for "is this still going."
 * The parent decides whether to render this at all based on that same read,
 * so mounting it *is* the signal that a run is in progress.
 */
export function GenerationPoller({ message, elapsedSuffix, stuckMessage, giveUpAfterSeconds = 150 }: GenerationPollerProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(seconds);
      router.refresh();
      if (seconds >= giveUpAfterSeconds) {
        setGaveUp(true);
        clearInterval(timer);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [router, giveUpAfterSeconds]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle px-3 py-2.5" role="status" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-text-secondary">{gaveUp ? stuckMessage : message}</span>
        <span className="text-xs tabular-nums text-text-muted">
          {elapsed}
          {elapsedSuffix}
        </span>
      </div>
      {gaveUp ? null : (
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-raised">
          <div className="animate-indeterminate h-full w-1/3 rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
}

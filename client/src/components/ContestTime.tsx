'use client';

import { useEffect, useMemo, useState } from 'react';

type ContestInfo = {
  startTime: string;
  endTime: string;
  isActive?: boolean;
} | null | undefined;

type ContestStatus = 'before' | 'during' | 'after';

function formatDistance(nowMs: number, targetMs: number): string {
  const distance = Math.max(0, targetMs - nowMs);
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function ContestTime({ contest }: { contest: ContestInfo }) {
  const [status, setStatus] = useState<ContestStatus>('before');
  const [display, setDisplay] = useState<string>('');

  const startMs = useMemo(() => (contest?.startTime ? new Date(contest.startTime).getTime() : null), [contest?.startTime]);
  const endMs = useMemo(() => (contest?.endTime ? new Date(contest.endTime).getTime() : null), [contest?.endTime]);

  useEffect(() => {
    if (!startMs || !endMs) return;

    const update = () => {
      const now = Date.now();
      if (now < startMs) {
        setStatus('before');
        setDisplay(formatDistance(now, startMs));
      } else if (now >= startMs && now < endMs) {
        setStatus('during');
        setDisplay(formatDistance(now, endMs));
      } else {
        setStatus('after');
        setDisplay('Contest Ended');
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startMs, endMs]);

  if (!contest || !startMs || !endMs) return null;

  const toneClass =
    status === 'before'
      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200'
      : status === 'during'
      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200'
      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div className={`w-full border rounded-lg px-4 py-3 font-mono text-sm ${toneClass}`}>
        {status === 'before' && (
          <div className="flex items-center justify-between">
            <span className="opacity-80">Contest starts in</span>
            <span className="text-base font-bold tracking-wider">{display}</span>
          </div>
        )}
        {status === 'during' && (
          <div className="flex items-center justify-between">
            <span className="opacity-80">Time remaining</span>
            <span className="text-base font-bold tracking-wider">{display}</span>
          </div>
        )}
        {status === 'after' && (
          <div className="flex items-center justify-center">
            <span className="text-base font-bold">🏁 {display}</span>
          </div>
        )}
      </div>
    </div>
  );
}



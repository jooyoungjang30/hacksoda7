import type { ReactNode } from 'react';
import type { PaceStatus } from '../../lib/types';

export type PillTone = 'good' | 'warn' | 'crit' | 'neutral' | 'brand';

const TONE_CLASSES: Record<PillTone, string> = {
  good: 'bg-good-bg text-good',
  warn: 'bg-warn-bg text-warn',
  crit: 'bg-crit-bg text-crit',
  neutral: 'bg-line text-muted',
  brand: 'bg-brand-soft text-brand',
};

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps the display-only PaceStatus to a Pill tone. Reuse everywhere a pace pill is shown. */
export function paceStatusTone(status: PaceStatus): PillTone {
  if (status === 'ahead' || status === 'on') return 'good';
  if (status === 'behind') return 'warn';
  return 'crit';
}

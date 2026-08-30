import type { PillTone } from './Pill';

const FILL_CLASSES: Record<'good' | 'warn' | 'crit', string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  crit: 'bg-crit',
};

export function ProgressBar({
  value,
  pace,
  tone,
}: {
  value: number; // 0..1
  pace?: number; // 0..1
  tone: 'good' | 'warn' | 'crit';
}) {
  const widthPct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="relative h-[7px] overflow-hidden rounded-full bg-line">
      <span className={`block h-full rounded-full ${FILL_CLASSES[tone]}`} style={{ width: `${widthPct}%` }} />
      {pace !== undefined && (
        <span
          className="absolute -top-[3px] -bottom-[3px] w-0.5 bg-ink opacity-55"
          style={{ left: `${pace * 100}%` }}
        />
      )}
    </div>
  );
}

export type { PillTone };

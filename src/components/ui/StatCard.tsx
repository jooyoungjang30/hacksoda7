import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  sub,
  tone,
  action,
  children,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'crit';
  action?: ReactNode;
  children?: ReactNode;
}) {
  const isCrit = tone === 'crit';
  return (
    <div
      className={`rounded-[10px] border p-4 ${isCrit ? 'border-[#F0C9C5] bg-[#FFFCFC]' : 'border-line bg-white'}`}
    >
      <div className={`text-[10.5px] font-semibold tracking-wider uppercase ${isCrit ? 'text-crit' : 'text-muted'}`}>
        {label}
      </div>
      <div className={`mt-[7px] mb-0.5 text-[29px] leading-none font-bold tracking-tight tabular-nums ${isCrit ? 'text-crit' : ''}`}>
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-muted">{sub}</div>}
      {children}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

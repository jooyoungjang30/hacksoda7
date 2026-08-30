import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[10px] border border-line bg-white ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[#EFEDF4] px-[18px] py-[15px]">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {sub && <span className="text-[11.5px] text-muted">{sub}</span>}
      {actions && <span className="ml-auto flex items-center gap-1.5">{actions}</span>}
    </div>
  );
}

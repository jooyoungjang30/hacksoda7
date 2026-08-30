import type { ReactNode } from 'react';

export function PageHeader({
  title,
  breadcrumb,
  actions,
}: {
  title: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-[26px] pt-5">
      <div>
        {breadcrumb && <div className="mb-[3px] text-[11.5px] text-muted">{breadcrumb}</div>}
        <h2 className="text-[23px] font-bold">{title}</h2>
      </div>
      {actions && <div className="ml-auto flex gap-2.5">{actions}</div>}
    </div>
  );
}

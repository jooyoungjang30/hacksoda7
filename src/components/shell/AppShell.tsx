import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-[1240px]">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-white">{children}</div>
    </div>
  );
}

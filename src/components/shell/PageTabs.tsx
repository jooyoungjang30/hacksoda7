import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/kudos', label: 'Dashboard', match: (path: string) => !path.startsWith('/kudos/network') && !path.startsWith('/kudos/relationships') },
  { to: '/kudos/network', label: 'Connection Map', match: (path: string) => path.startsWith('/kudos/network') },
  { to: '/kudos/relationships', label: 'Relationships', match: (path: string) => path.startsWith('/kudos/relationships') },
];

export function PageTabs() {
  const location = useLocation();

  return (
    <div className="mt-4 flex gap-0.5 border-b border-[#E5E7EB] px-[26px]">
      {TABS.map((tab) => {
        const active = tab.match(location.pathname);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`relative top-px rounded-t-md border border-b-0 px-5 py-[11px] text-[13.5px] ${
              active
                ? 'border-[#DDD6EA] bg-white font-semibold text-brand-dark shadow-[0_2px_0_#fff]'
                : 'border-transparent text-muted'
            }`}
          >
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}

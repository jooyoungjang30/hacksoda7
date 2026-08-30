import { NavLink, useLocation } from 'react-router-dom';

export function PageTabs() {
  const location = useLocation();
  const dashboardActive = !location.pathname.startsWith('/kudos/network');

  return (
    <div className="mt-4 flex gap-0.5 border-b border-[#E5E7EB] px-[26px]">
      <NavLink
        to="/kudos"
        className={`relative top-px rounded-t-md border border-b-0 px-5 py-[11px] text-[13.5px] ${
          dashboardActive
            ? 'border-[#DDD6EA] bg-white font-semibold text-brand-dark shadow-[0_2px_0_#fff]'
            : 'border-transparent text-muted'
        }`}
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/kudos/network"
        className={`relative top-px rounded-t-md border border-b-0 px-5 py-[11px] text-[13.5px] ${
          !dashboardActive
            ? 'border-[#DDD6EA] bg-white font-semibold text-brand-dark shadow-[0_2px_0_#fff]'
            : 'border-transparent text-muted'
        }`}
      >
        Network Map
      </NavLink>
    </div>
  );
}

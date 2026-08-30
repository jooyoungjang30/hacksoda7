import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: '▤', label: 'Create order' },
  { icon: '▦', label: 'Order history' },
  { icon: '♡', label: 'Kudos Gift Tracker', active: true, badge: 'NEW' },
  { icon: '◔', label: 'Funding' },
  { icon: '⚙', label: 'Setting' },
  { icon: '▷', label: 'API Docs' },
];

export function Sidebar() {
  return (
    <div
      className="w-[232px] flex-none pt-[22px] text-white"
      style={{ background: 'linear-gradient(178deg,#4A1E8F 0%,#3A1571 46%,#2A0E52 100%)' }}
    >
      <div className="flex items-center gap-2.5 px-5 pb-5">
        <span className="flex h-[31px] w-[31px] items-center justify-center rounded-lg bg-white text-[15px]">
          🎁
        </span>
        <div>
          <b className="block text-[17px] leading-tight font-bold tracking-tight">SodaGift</b>
          <span className="text-[9.5px] opacity-70 tracking-wide">for Biz</span>
        </div>
      </div>
      <hr className="mx-5 mb-4 border-white/16" />
      <div className="mx-[18px] mb-5 rounded-lg border border-white/28 px-[13px] py-[11px]">
        <b className="block text-sm font-semibold">Vega</b>
        <span className="text-xs opacity-78">200 employees · FY2026</span>
      </div>
      <nav>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2.5 px-5 py-3 text-[13.5px] ${
              item.active
                ? 'bg-black/30 font-semibold text-white shadow-[inset_3px_0_0_#C9A8FF]'
                : 'text-white/72'
            }`}
          >
            <em className="w-[17px] text-center text-[13px] not-italic opacity-85">{item.icon}</em>
            {item.label}
            {item.badge && (
              <span className="ml-auto rounded bg-[#C2185B] px-[5px] py-0.5 text-[8.5px] font-bold tracking-wide text-white">
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </nav>
      <Link
        to="/me/overview"
        className="mx-[18px] mt-5 flex items-center gap-2 rounded-lg border border-white/28 px-[13px] py-2.5 text-[12.5px] text-white/80 hover:bg-white/10"
      >
        <em className="not-italic opacity-85">↦</em> View as employee
      </Link>
    </div>
  );
}

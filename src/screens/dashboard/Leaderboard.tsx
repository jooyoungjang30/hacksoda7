import { Avatar } from '../../components/ui/Avatar';
import { Card, CardHeader } from '../../components/ui/Card';
import { Money } from '../../components/ui/Money';
import type { LeaderboardRow } from '../../lib/types';

const RANK_COLOR: Record<number, string> = { 1: '#B8860B', 2: '#8A8F9C', 3: '#A0703C' };

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <Card>
      <CardHeader title="Most appreciated" sub="by Kudos received" />
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className="w-[34px] border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-left text-[10px] font-semibold tracking-wider text-muted uppercase">
              #
            </th>
            <th className="border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-left text-[10px] font-semibold tracking-wider text-muted uppercase">
              Person
            </th>
            <th className="border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-right text-[10px] font-semibold tracking-wider text-muted uppercase">
              Received
            </th>
            <th className="border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-right text-[10px] font-semibold tracking-wider text-muted uppercase">
              Kudos
            </th>
            <th className="border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-right text-[10px] font-semibold tracking-wider text-muted uppercase">
              Givers
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rank = i + 1;
            const rankColor = RANK_COLOR[rank];
            return (
              <tr key={row.person.id}>
                <td
                  className="border-b border-[#F2F0F7] px-3.5 py-2.5 font-bold"
                  style={{ color: rankColor ?? undefined }}
                >
                  {rank}
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.person.initials} color={row.team.color} />
                    <div>
                      <b className="block text-[12.5px] leading-tight font-semibold">{row.person.name}</b>
                      <span className="text-[11px] text-muted">{row.team.name}</span>
                    </div>
                  </div>
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right font-bold tabular-nums">
                  <Money cents={row.receivedCents} />
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                  {row.kudosCount}
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                  {row.distinctGivers}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

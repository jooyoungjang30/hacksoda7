import { describe, expect, it } from 'vitest';
import { mockPeople } from '../mock/people';
import { mockKudos } from '../mock/kudos';
import { mockTeams } from '../mock/teams';
import {
  computeCompanyStats,
  computeLeaderboard,
  computeMemberStats,
  computeTeamStats,
  computeClaimByTeam,
} from './derive';

const personById = (id: string) => mockPeople.find((p) => p.id === id)!;
const teamOf = (id: string) => personById(id).teamId;

describe('derive', () => {
  it('computes company totals', () => {
    const stats = computeCompanyStats(mockPeople, mockKudos);
    expect(stats.givenCents).toBe(212100);
    expect(stats.claimedCents).toBe(175900);
    expect(stats.participantCount).toBe(39);
  });

  it('computes Engineering usage and pace', () => {
    const teamStats = computeTeamStats(mockPeople, mockKudos);
    const engineering = teamStats.find((t) => t.team.id === 'engineering')!;
    expect(engineering.usageRatio).toBeCloseTo(0.539, 2);
    expect(engineering.paceStatus).toBe('behind');
  });

  it('flags Sales as far behind pace', () => {
    const teamStats = computeTeamStats(mockPeople, mockKudos);
    const sales = teamStats.find((t) => t.team.id === 'sales')!;
    expect(sales.paceStatus).toBe('far_behind');
  });

  it('ranks Priya Raman first on the leaderboard', () => {
    const leaderboard = computeLeaderboard(mockPeople, mockKudos, 7);
    expect(leaderboard[0].person.name).toBe('Priya Raman');
    expect(leaderboard[0].receivedCents).toBe(14500);
  });

  it('marks Jonas Kerr as never having given, but nudgeable', () => {
    const stats = computeMemberStats('jonas-kerr', mockPeople, mockKudos);
    expect(stats.givenCents).toBe(0);
    expect(stats.lastGivenAt).toBeNull();
    expect(stats.nudgeable).toBe(true);
  });

  it('keeps Tomás nudgeable even though he is ahead of pace', () => {
    const stats = computeMemberStats('tomas-iglesias', mockPeople, mockKudos);
    expect(stats.paceStatus).toBe('ahead');
    expect(stats.nudgeable).toBe(true);
  });

  it('is the only case where Priya is not nudgeable', () => {
    const stats = computeMemberStats('priya-raman', mockPeople, mockKudos);
    expect(stats.nudgeable).toBe(false);
  });

  it('sorts Finance lowest in claim rate', () => {
    const claimByTeam = computeClaimByTeam(mockPeople, mockKudos);
    expect(claimByTeam[0].team.name).toBe('Finance');
    expect(claimByTeam[0].claimRatio).toBeCloseTo(0.5, 2);
  });

  it('counts 9 gift cards expiring within 30 days', () => {
    const stats = computeCompanyStats(mockPeople, mockKudos);
    expect(stats.expiringSoonCount).toBe(9);
  });
});

// Permanent data-integrity assertions on the raw mock arrays, independent of
// derive.ts, so a bug in derive.ts cannot mask a bug in the data (or vice versa).
// Merged in after an independent review caught three defects these cover.
describe('mock data integrity', () => {
  it('has no self-kudos records', () => {
    expect(mockKudos.filter((k) => k.fromId === k.toId)).toHaveLength(0);
  });

  it('conserves value: every given cent is a received cent, and every id is real', () => {
    const ids = new Set(mockPeople.map((p) => p.id));
    expect(mockKudos.every((k) => ids.has(k.fromId) && ids.has(k.toId))).toBe(true);
    const given = mockKudos.reduce((s, k) => s + k.amountCents, 0);
    expect(given).toBe(212100);
  });

  it('matches per-team GIVEN exactly (plan §4)', () => {
    const out: Record<string, number> = {};
    for (const t of mockTeams) {
      out[t.name] = mockKudos.filter((k) => teamOf(k.fromId) === t.id).reduce((s, k) => s + k.amountCents, 0) / 100;
    }
    expect(out).toEqual({ Engineering: 604, Design: 391, Marketing: 470, Sales: 286, 'People Ops': 278, Finance: 92 });
  });

  it('matches per-team open-card counts exactly (plan §4)', () => {
    const openCounts: Record<string, number> = {};
    for (const t of mockTeams) {
      openCounts[t.name] = mockKudos.filter((k) => teamOf(k.toId) === t.id && !k.claimedAt).length;
    }
    expect(openCounts).toEqual({ Engineering: 5, Design: 3, Marketing: 6, Sales: 12, 'People Ops': 2, Finance: 4 });
  });

  it('matches the 8 named Engineering members exactly (plan §4)', () => {
    const names = [
      'Priya Raman', 'Marcus Bell', 'Dana Whitfield', 'Tomás Iglesias',
      'Wei Chen', 'Aisha Nkemdi', 'Ravi Menon', 'Jonas Kerr',
    ];
    const rows = names.map((n) => {
      const p = mockPeople.find((x) => x.name === n)!;
      const recv = mockKudos.filter((k) => k.toId === p.id);
      return {
        name: n,
        given: mockKudos.filter((k) => k.fromId === p.id).reduce((s, k) => s + k.amountCents, 0) / 100,
        received: recv.reduce((s, k) => s + k.amountCents, 0) / 100,
        unclaimed: recv.filter((k) => !k.claimedAt).reduce((s, k) => s + k.amountCents, 0) / 100,
      };
    });
    expect(rows).toEqual([
      { name: 'Priya Raman', given: 80, received: 145, unclaimed: 0 },
      { name: 'Marcus Bell', given: 72, received: 60, unclaimed: 0 },
      { name: 'Dana Whitfield', given: 65, received: 95, unclaimed: 25 },
      { name: 'Tomás Iglesias', given: 55, received: 40, unclaimed: 0 },
      { name: 'Wei Chen', given: 50, received: 110, unclaimed: 25 },
      { name: 'Aisha Nkemdi', given: 45, received: 55, unclaimed: 0 },
      { name: 'Ravi Menon', given: 20, received: 30, unclaimed: 30 },
      { name: 'Jonas Kerr', given: 0, received: 25, unclaimed: 25 },
    ]);
  });

  it('matches the leaderboard top 7 exactly, with no tie displacing Kofi (defect 2)', () => {
    const rows = mockPeople
      .map((p) => {
        const recv = mockKudos.filter((k) => k.toId === p.id);
        return {
          name: p.name,
          received: recv.reduce((s, k) => s + k.amountCents, 0) / 100,
          kudos: recv.length,
          givers: new Set(recv.map((k) => k.fromId)).size,
        };
      })
      .sort((a, b) => b.received - a.received)
      .slice(0, 7);
    expect(rows).toEqual([
      { name: 'Priya Raman', received: 145, kudos: 11, givers: 9 },
      { name: 'Wei Chen', received: 110, kudos: 9, givers: 7 },
      { name: 'Sofia Marchetti', received: 105, kudos: 12, givers: 8 },
      { name: 'Dana Whitfield', received: 95, kudos: 7, givers: 6 },
      { name: 'Leah Osborne', received: 90, kudos: 10, givers: 9 },
      { name: 'Ana Duarte', received: 75, kudos: 6, givers: 5 },
      { name: 'Kofi Mensah', received: 70, kudos: 6, givers: 6 },
    ]);
  });

  it('produces the network-map shapes: Sales closed loop, Leah the connector, 6 dormant (defect 3)', () => {
    const sales = mockTeams.find((t) => t.name === 'Sales')!;
    const salesOut = mockKudos.filter((k) => teamOf(k.fromId) === sales.id);
    const intra = salesOut.filter((k) => teamOf(k.toId) === sales.id);
    expect(intra.length / salesOut.length).toBeGreaterThanOrEqual(0.8);

    const leah = mockPeople.find((p) => p.name === 'Leah Osborne')!;
    const leahTeams = new Set(mockKudos.filter((k) => k.fromId === leah.id).map((k) => teamOf(k.toId)));
    expect(leahTeams.size).toBeGreaterThanOrEqual(5);

    const cutoff = new Date('2026-05-31T23:59:59Z').getTime();
    const dormant = mockPeople.filter(
      (p) => !mockKudos.some((k) => (k.fromId === p.id || k.toId === p.id) && new Date(k.sentAt).getTime() > cutoff),
    );
    expect(dormant.length).toBe(6);
  });
});

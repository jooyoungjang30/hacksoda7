import { daysUntil, fiscalYearProgress } from './clock';
import type {
  Office,
  OfficeCoverage,
  CompanyStats,
  Kudo,
  LeaderboardRow,
  MemberStats,
  PaceStatus,
  Person,
  PersonId,
  Team,
  TeamClaimRow,
  TeamId,
  TeamStats,
} from './types';

export const ANNUAL_ALLOWANCE_CENTS = 8000;
const EXPIRING_SOON_DAYS = 30;

export function paceStatus(usageRatio: number, pace: number): PaceStatus {
  if (usageRatio >= pace) return 'ahead';
  if (usageRatio >= pace - 0.05) return 'on';
  if (usageRatio >= pace - 0.2) return 'behind';
  return 'far_behind';
}

/** Display-only label for a pace pill/sub-text. Not used for any targeting decision. */
export function paceLabel(usageRatio: number, pace: number): string {
  const pointsBehind = Math.round((pace - usageRatio) * 100);
  if (pointsBehind > 0) return `${pointsBehind} pts behind`;
  const pointsAhead = -pointsBehind;
  return pointsAhead < 10 ? 'On pace' : 'Ahead of pace';
}

function teamById(teamId: TeamId, teams: Team[]): Team {
  const team = teams.find((t) => t.id === teamId);
  if (!team) throw new Error(`Unknown team id: ${teamId}`);
  return team;
}

export function computeMemberStats(personId: PersonId, people: Person[], kudos: Kudo[]): MemberStats {
  const person = people.find((p) => p.id === personId);
  if (!person) throw new Error(`Unknown person id: ${personId}`);

  const given = kudos.filter((k) => k.fromId === personId);
  const received = kudos.filter((k) => k.toId === personId);

  const givenCents = given.reduce((sum, k) => sum + k.amountCents, 0);
  const receivedCents = received.reduce((sum, k) => sum + k.amountCents, 0);
  const unclaimed = received.filter((k) => k.claimedAt === null);
  const unclaimedCents = unclaimed.reduce((sum, k) => sum + k.amountCents, 0);
  const claimedCents = receivedCents - unclaimedCents;

  // Capped at 100% — the send flow (see employee/Send.tsx) never lets anyone commit
  // more than their allowance, so a ratio above 1 here would only be an artifact of
  // stale seed data, not something that can happen through the app itself.
  const usageRatio = Math.min(1, givenCents / ANNUAL_ALLOWANCE_CENTS);
  const pace = fiscalYearProgress();

  const lastGivenAt = given.length
    ? given.reduce((latest, k) => (k.sentAt > latest ? k.sentAt : latest), given[0].sentAt)
    : null;

  const nearestExpiryAt = unclaimed.length
    ? unclaimed.reduce((earliest, k) => (k.expiresAt < earliest ? k.expiresAt : earliest), unclaimed[0].expiresAt)
    : null;

  return {
    person,
    givenCents,
    allowanceCents: ANNUAL_ALLOWANCE_CENTS,
    usageRatio,
    paceStatus: paceStatus(usageRatio, pace),
    receivedCents,
    claimedCents,
    unclaimedCents,
    unclaimedCount: unclaimed.length,
    nearestExpiryAt,
    lastGivenAt,
    nudgeable: usageRatio < 1 || unclaimed.length > 0,
  };
}

export function computeTeamMemberStats(teamId: TeamId, people: Person[], kudos: Kudo[]): MemberStats[] {
  return people
    .filter((p) => p.teamId === teamId)
    .map((p) => computeMemberStats(p.id, people, kudos))
    .sort((a, b) => a.usageRatio - b.usageRatio);
}

export function computeTeamStats(people: Person[], teams: Team[], kudos: Kudo[]): TeamStats[] {
  const pace = fiscalYearProgress();
  return teams
    .map((team) => {
      const members = people.filter((p) => p.teamId === team.id);
      const memberStats = members.map((p) => computeMemberStats(p.id, people, kudos));
      const givenCents = memberStats.reduce((sum, m) => sum + m.givenCents, 0);
      const allowanceCents = members.length * ANNUAL_ALLOWANCE_CENTS;
      const usageRatio = allowanceCents > 0 ? Math.min(1, givenCents / allowanceCents) : 0;
      const membersWithBudgetLeft = memberStats.filter((m) => m.usageRatio < 1).length;

      return {
        team,
        memberCount: members.length,
        givenCents,
        allowanceCents,
        usageRatio,
        paceStatus: paceStatus(usageRatio, pace),
        membersWithBudgetLeft,
      };
    })
    .sort((a, b) => a.usageRatio - b.usageRatio);
}

export function computeCompanyStats(
  people: Person[],
  kudos: Kudo[],
  offices: Office[] = [],
): CompanyStats {
  const givenCents = kudos.reduce((sum, k) => sum + k.amountCents, 0);
  const receivedCents = givenCents; // closed system — every given kudo is received by someone in the array
  const unclaimed = kudos.filter((k) => k.claimedAt === null);
  const unclaimedCents = unclaimed.reduce((sum, k) => sum + k.amountCents, 0);
  const claimedCents = receivedCents - unclaimedCents;

  const givers = new Set(kudos.map((k) => k.fromId));
  const reached = new Set(kudos.map((k) => k.toId));
  const officeOf = new Map(people.map((p) => [p.id, p.officeId]));

  const byOffice: OfficeCoverage[] = offices.map((office) => {
    const members = people.filter((p) => p.officeId === office.id);
    const hit = members.filter((p) => reached.has(p.id)).length;
    return {
      office,
      headcount: members.length,
      reachedCount: hit,
      ratio: members.length > 0 ? hit / members.length : 0,
      inboundFromElsewhere: kudos.filter(
        (k) => officeOf.get(k.toId) === office.id && officeOf.get(k.fromId) !== office.id,
      ).length,
    };
  });
  const expiringSoon = unclaimed.filter((k) => daysUntil(k.expiresAt) <= EXPIRING_SOON_DAYS);

  return {
    headcount: people.length,
    givenCents,
    allowanceCents: people.length * ANNUAL_ALLOWANCE_CENTS,
    usageRatio: Math.min(1, givenCents / (people.length * ANNUAL_ALLOWANCE_CENTS)),
    paceRatio: fiscalYearProgress(),
    participantCount: givers.size,
    receivedCents,
    claimedCents,
    claimRatio: receivedCents > 0 ? claimedCents / receivedCents : 0,
    openCount: unclaimed.length,
    expiringSoonCents: expiringSoon.reduce((sum, k) => sum + k.amountCents, 0),
    expiringSoonCount: expiringSoon.length,
    reachedCount: reached.size,
    coverageRatio: people.length > 0 ? reached.size / people.length : 0,
    byOffice: byOffice.sort((a, b) => b.headcount - a.headcount),
  };
}

/** Distinct recipients holding a gift card that expires within 30 days, unclaimed. */
export function computeExpiringSoonRecipientIds(kudos: Kudo[]): PersonId[] {
  const expiringSoon = kudos.filter((k) => k.claimedAt === null && daysUntil(k.expiresAt) <= EXPIRING_SOON_DAYS);
  return [...new Set(expiringSoon.map((k) => k.toId))];
}

export function computeLeaderboard(people: Person[], teams: Team[], kudos: Kudo[], limit: number): LeaderboardRow[] {
  return people
    .map((person) => {
      const received = kudos.filter((k) => k.toId === person.id);
      const receivedCents = received.reduce((sum, k) => sum + k.amountCents, 0);
      const distinctGivers = new Set(received.map((k) => k.fromId)).size;
      return {
        person,
        team: teamById(person.teamId, teams),
        receivedCents,
        kudosCount: received.length,
        distinctGivers,
      };
    })
    .sort((a, b) => b.receivedCents - a.receivedCents)
    .slice(0, limit);
}

export function computeClaimByTeam(people: Person[], teams: Team[], kudos: Kudo[]): TeamClaimRow[] {
  return teams
    .map((team) => {
      const members = people.filter((p) => p.teamId === team.id);
      const memberIds = new Set(members.map((p) => p.id));
      const received = kudos.filter((k) => memberIds.has(k.toId));
      const receivedCents = received.reduce((sum, k) => sum + k.amountCents, 0);
      const unclaimed = received.filter((k) => k.claimedAt === null);
      const claimedCents = receivedCents - unclaimed.reduce((sum, k) => sum + k.amountCents, 0);

      return {
        team,
        memberCount: members.length,
        receivedCents,
        claimedCents,
        claimRatio: receivedCents > 0 ? claimedCents / receivedCents : 0,
        openCount: unclaimed.length,
      };
    })
    .sort((a, b) => a.claimRatio - b.claimRatio);
}

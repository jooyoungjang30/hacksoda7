export type TeamId = string;
export type PersonId = string;

export interface Team {
  id: TeamId;
  name: string;
  color: string; // hex — used by avatars, pills, and graph nodes
}

export interface Person {
  id: PersonId;
  name: string;
  initials: string;
  role: string;
  teamId: TeamId;
  slackLinked: boolean; // drives the email-fallback flag in 1.3
  // Flat, one level: each team's lead/manager has managerId null, everyone else on
  // that team reports to them. Powers the "reach out to this person's manager"
  // action items on the network map's HR Insights panel.
  managerId: PersonId | null;
}

/** The only authored data. Everything else is derived from this array. */
export interface Kudo {
  id: string;
  fromId: PersonId;
  toId: PersonId;
  amountCents: number;
  message: string;
  sentAt: string; // ISO date
  claimedAt: string | null; // null = outstanding
  expiresAt: string; // ISO date
}

export type PaceStatus = 'ahead' | 'on' | 'behind' | 'far_behind';
export type NudgeTemplate = 'unused_budget' | 'unclaimed_gift' | 'manager_gap';

export interface NudgeRecord {
  personId: PersonId;
  template: NudgeTemplate;
  sentAt: string;
}

// --- Derived shapes (returned by derive.ts, never authored) ---

export interface MemberStats {
  person: Person;
  givenCents: number;
  allowanceCents: number; // always ANNUAL_ALLOWANCE_CENTS
  usageRatio: number; // 0..1
  paceStatus: PaceStatus;
  receivedCents: number;
  claimedCents: number;
  unclaimedCents: number;
  unclaimedCount: number;
  nearestExpiryAt: string | null; // earliest expiresAt among unclaimed cards, null if none
  lastGivenAt: string | null;
  nudgeable: boolean;
}

export interface TeamStats {
  team: Team;
  memberCount: number;
  givenCents: number;
  allowanceCents: number;
  usageRatio: number;
  paceStatus: PaceStatus;
  membersWithBudgetLeft: number; // powers the team-nudge label + skip rule
}

export interface TeamClaimRow {
  team: Team;
  memberCount: number;
  receivedCents: number;
  claimedCents: number;
  claimRatio: number;
  openCount: number;
}

export interface LeaderboardRow {
  person: Person;
  team: Team;
  receivedCents: number;
  kudosCount: number;
  distinctGivers: number;
}

export interface CompanyStats {
  headcount: number;
  givenCents: number;
  allowanceCents: number;
  usageRatio: number;
  paceRatio: number; // fiscal year elapsed
  participantCount: number; // gave >= 1
  receivedCents: number;
  claimedCents: number;
  claimRatio: number;
  openCount: number;
  expiringSoonCents: number; // unclaimed, expires <= 30d
  expiringSoonCount: number;
}

// --- Relationships tab (single-person view of the same kudos records) ---

/** A one-word reason a person surfaces in the directory. Priority order when more
 * than one applies: earlier entries are more actionable and win. */
export type PersonFlag = 'unreached' | 'single_source' | 'receive_only' | 'manager_gap' | 'team_only' | null;

export interface PersonDirectoryRow {
  person: Person;
  manager: Person | null;
  receivedCents: number;
  givenCents: number;
  connectionCount: number; // distinct colleagues exchanged with, either direction
  lastExchangeAt: string | null;
  flag: PersonFlag;
}

/** One line in the reporting-line diagram — the manager, or a colleague this
 * person has exchanged kudos with. */
export interface RelationshipEdge {
  person: Person;
  totalCents: number; // combined value of kudos in both directions
  direction: 'given' | 'received' | 'both';
}

export interface PersonExchange {
  kudo: Kudo;
  direction: 'in' | 'out';
  other: Person;
}

export interface PersonDetail {
  stats: MemberStats;
  manager: Person | null;
  managerLink: RelationshipEdge | null; // null when never exchanged with the manager
  connections: RelationshipEdge[]; // sorted by totalCents descending, manager excluded
  exchanges: PersonExchange[]; // sorted newest first
  flag: PersonFlag;
}

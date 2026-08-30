import { TODAY } from '../lib/clock';
import { mockPeople } from '../mock/people';
import { mockKudos } from '../mock/kudos';
import { mockTeams } from '../mock/teams';
import type { Person, PersonId, Team, TeamId } from '../lib/types';

const DORMANT_DAYS = 90;
const DORMANT_COLOR = '#B9AECF';

export interface GraphNode {
  id: PersonId;
  name: string;
  teamId: TeamId;
  color: string;
  r: number;
  receivedCents: number;
  isDormant: boolean;
}

export interface GraphLink {
  source: PersonId;
  target: PersonId;
  width: number;
  color: string;
}

/** One manager and the people on this list who report to them — the unit an HR
 * reach-out action is organized around, so nobody has to contact five individuals
 * when one message to their manager covers all of them. */
export interface ManagerActionGroup {
  manager: Person;
  people: Person[];
}

export interface GraphInsights {
  mostReliedOn: { person: Person; distinctGivers: number; teamsSpanned: number };
  connector: { person: Person; teamsSentInto: number };
  mostClosedTeam: { team: Team; ratio: number; manager: Person };
  /** No kudos given or received in the last 90 days. */
  dormant: { count: number; groups: ManagerActionGroup[] };
  mutualPairRatio: number;
  /** Share of ALL company kudos that cross a team boundary — the org-wide
   * collaboration headline, as distinct from any one team's closed ratio. */
  crossTeamRatio: number;
  /** Received kudos at least once but has never given any — recognised, but not
   * participating in the culture of giving. */
  receiveOnly: { count: number; groups: ManagerActionGroup[] };
  /** Everything they've ever received came from a single colleague — if that one
   * relationship lapses, they get no organic recognition at all. */
  singleSource: { count: number; groups: ManagerActionGroup[] };
  /** Team pairs whose only connection runs through a single person on each side —
   * if either leaves, those two teams stop exchanging kudos entirely. */
  fragileBridges: {
    count: number;
    totalConnectedPairs: number;
    example: { teamA: Team; teamB: Team; people: [Person, Person]; managers: [Person, Person] } | null;
  };
  /** The single strongest two-way relationship, by combined kudos value. */
  strongestBond: { a: Person; b: Person; totalCents: number } | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function teamById(teamId: TeamId): Team {
  return mockTeams.find((t) => t.id === teamId)!;
}

function personById(personId: PersonId): Person {
  return mockPeople.find((p) => p.id === personId)!;
}

function managerOf(person: Person): Person | null {
  return person.managerId ? personById(person.managerId) : null;
}

/** The one person on a team with no manager of their own. */
function managerOfTeam(teamId: TeamId): Person {
  return mockPeople.find((p) => p.teamId === teamId && p.managerId === null)!;
}

/** Groups people needing follow-up by who to actually contact: their manager.
 * Anyone with no manager on file (a team lead themselves) is defensively skipped —
 * none of the current risk cohorts include a team lead, but a future data edit
 * shouldn't silently misattribute the group if one ever does. */
function groupByManager(people: Person[]): ManagerActionGroup[] {
  const byManager = new Map<PersonId, ManagerActionGroup>();
  for (const person of people) {
    const manager = managerOf(person);
    if (!manager) continue;
    const existing = byManager.get(manager.id);
    if (existing) existing.people.push(person);
    else byManager.set(manager.id, { manager, people: [person] });
  }
  return [...byManager.values()].sort(
    (a, b) => b.people.length - a.people.length || a.manager.name.localeCompare(b.manager.name),
  );
}

function isDormant(personId: PersonId): boolean {
  const cutoff = TODAY.getTime() - DORMANT_DAYS * 24 * 60 * 60 * 1000;
  return !mockKudos.some(
    (k) => (k.fromId === personId || k.toId === personId) && new Date(k.sentAt).getTime() > cutoff,
  );
}

/** Insights are always computed from the full company-wide dataset — they describe
 * fixed facts about the org, independent of the graph's current filter/toggle state. */
function computeInsights(): GraphInsights {
  const realKudos = mockKudos.filter((k) => k.fromId !== k.toId);

  const dormantPeople = mockPeople.filter((p) => isDormant(p.id));

  // mostReliedOn: highest distinct-giver count, + how many teams those givers span
  let mostReliedOn = { person: mockPeople[0], distinctGivers: -1, teamsSpanned: 0 };
  for (const person of mockPeople) {
    const givers = mockKudos.filter((k) => k.toId === person.id).map((k) => k.fromId);
    const distinctGivers = new Set(givers).size;
    if (distinctGivers > mostReliedOn.distinctGivers) {
      const teamsSpanned = new Set(givers.map((id) => personById(id).teamId)).size;
      mostReliedOn = { person, distinctGivers, teamsSpanned };
    }
  }

  // connector: highest count of distinct teams sent into
  let connector = { person: mockPeople[0], teamsSentInto: -1 };
  for (const person of mockPeople) {
    const recipients = mockKudos.filter((k) => k.fromId === person.id).map((k) => k.toId);
    const teamsSentInto = new Set(recipients.map((id) => personById(id).teamId)).size;
    if (teamsSentInto > connector.teamsSentInto) connector = { person, teamsSentInto };
  }

  // mostClosedTeam: highest ratio of intra-team out-edges to total out-edges
  let mostClosedTeam = { team: mockTeams[0], ratio: -1 };
  for (const team of mockTeams) {
    const memberIds = new Set(mockPeople.filter((p) => p.teamId === team.id).map((p) => p.id));
    const out = mockKudos.filter((k) => memberIds.has(k.fromId));
    if (out.length === 0) continue;
    const intra = out.filter((k) => memberIds.has(k.toId));
    const ratio = intra.length / out.length;
    if (ratio > mostClosedTeam.ratio) mostClosedTeam = { team, ratio };
  }

  // mutualPairRatio: pairs with edges in both directions / total distinct pairs
  const pairs = new Set<string>();
  const directed = new Set<string>();
  const pairTotals = new Map<string, number>();
  for (const k of realKudos) {
    const [a, b] = [k.fromId, k.toId].sort();
    const key = `${a}|${b}`;
    pairs.add(key);
    directed.add(`${k.fromId}>${k.toId}`);
    pairTotals.set(key, (pairTotals.get(key) ?? 0) + k.amountCents);
  }
  let mutualCount = 0;
  for (const pair of pairs) {
    const [a, b] = pair.split('|');
    if (directed.has(`${a}>${b}`) && directed.has(`${b}>${a}`)) mutualCount++;
  }
  const mutualPairRatio = pairs.size > 0 ? mutualCount / pairs.size : 0;

  // crossTeamRatio: org-wide share of edges that cross a team boundary
  const crossEdges = realKudos.filter((k) => personById(k.fromId).teamId !== personById(k.toId).teamId);
  const crossTeamRatio = realKudos.length > 0 ? crossEdges.length / realKudos.length : 0;

  // receiveOnly: received at least once, never gave
  const receiveOnlyPeople = mockPeople.filter((p) => {
    const gave = mockKudos.some((k) => k.fromId === p.id);
    const received = mockKudos.some((k) => k.toId === p.id);
    return received && !gave;
  });

  // singleSource: every kudo they've received came from the same one person
  const singleSourcePeople = mockPeople.filter((p) => {
    const givers = new Set(mockKudos.filter((k) => k.toId === p.id).map((k) => k.fromId));
    return givers.size === 1;
  });

  // fragileBridges: team pairs connected by exactly one person on each side
  let fragileCount = 0;
  let totalConnectedPairs = 0;
  let fragileExample: GraphInsights['fragileBridges']['example'] = null;
  for (let i = 0; i < mockTeams.length; i++) {
    for (let j = i + 1; j < mockTeams.length; j++) {
      const teamA = mockTeams[i];
      const teamB = mockTeams[j];
      const bridging = realKudos.filter((k) => {
        const ta = personById(k.fromId).teamId;
        const tb = personById(k.toId).teamId;
        return (ta === teamA.id && tb === teamB.id) || (ta === teamB.id && tb === teamA.id);
      });
      if (bridging.length === 0) continue;
      totalConnectedPairs++;
      const distinctBridgers = [...new Set(bridging.flatMap((k) => [k.fromId, k.toId]))];
      if (distinctBridgers.length <= 2) {
        fragileCount++;
        if (!fragileExample) {
          const people: [Person, Person] = [personById(distinctBridgers[0]), personById(distinctBridgers[1])];
          fragileExample = {
            teamA,
            teamB,
            people,
            managers: [managerOfTeam(people[0].teamId), managerOfTeam(people[1].teamId)],
          };
        }
      }
    }
  }

  // strongestBond: highest combined two-way total between any one pair
  let strongestBond: GraphInsights['strongestBond'] = null;
  let bestTotal = -1;
  for (const [key, total] of pairTotals) {
    if (total > bestTotal) {
      const [a, b] = key.split('|');
      bestTotal = total;
      strongestBond = { a: personById(a), b: personById(b), totalCents: total };
    }
  }

  return {
    mostReliedOn,
    connector,
    mostClosedTeam: { ...mostClosedTeam, manager: managerOfTeam(mostClosedTeam.team.id) },
    dormant: { count: dormantPeople.length, groups: groupByManager(dormantPeople) },
    mutualPairRatio,
    crossTeamRatio,
    receiveOnly: { count: receiveOnlyPeople.length, groups: groupByManager(receiveOnlyPeople) },
    singleSource: { count: singleSourcePeople.length, groups: groupByManager(singleSourcePeople) },
    fragileBridges: { count: fragileCount, totalConnectedPairs, example: fragileExample },
    strongestBond,
  };
}

export function useKudosGraph({
  crossTeamOnly,
  teamFilter,
}: {
  crossTeamOnly: boolean;
  teamFilter: TeamId | 'all';
}) {
  const people = teamFilter === 'all' ? mockPeople : mockPeople.filter((p) => p.teamId === teamFilter);
  const peopleIds = new Set(people.map((p) => p.id));

  const nodes: GraphNode[] = people.map((person) => {
    const receivedCents = mockKudos.filter((k) => k.toId === person.id).reduce((s, k) => s + k.amountCents, 0);
    const dormant = isDormant(person.id);
    return {
      id: person.id,
      name: person.name.split(' ')[0],
      teamId: person.teamId,
      color: dormant ? DORMANT_COLOR : teamById(person.teamId).color,
      r: clamp(3 + Math.sqrt(receivedCents / 100) * 0.5, 3, 9),
      receivedCents,
      isDormant: dormant,
    };
  });

  const aggregated = new Map<string, { source: PersonId; target: PersonId; amount: number; color: string }>();
  for (const k of mockKudos) {
    if (k.fromId === k.toId) continue;
    if (!peopleIds.has(k.fromId) || !peopleIds.has(k.toId)) continue;
    if (crossTeamOnly) {
      const fromTeam = mockPeople.find((p) => p.id === k.fromId)!.teamId;
      const toTeam = mockPeople.find((p) => p.id === k.toId)!.teamId;
      if (fromTeam === toTeam) continue;
    }
    const key = `${k.fromId}>${k.toId}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.amount += k.amountCents;
    } else {
      const giverTeam = mockPeople.find((p) => p.id === k.fromId)!.teamId;
      aggregated.set(key, { source: k.fromId, target: k.toId, amount: k.amountCents, color: teamById(giverTeam).color });
    }
  }

  const links: GraphLink[] = [...aggregated.values()].map((a) => ({
    source: a.source,
    target: a.target,
    width: clamp(1 + a.amount / 1500, 1, 3),
    color: a.color,
  }));

  return { nodes, links, insights: computeInsights() };
}

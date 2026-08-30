import { TODAY } from '../lib/clock';
import type { Kudo, Person, PersonId, Team, TeamId , Office } from '../lib/types';

const DORMANT_DAYS = 90;
const DORMANT_COLOR = '#B9AECF';

export interface GraphNode {
  id: PersonId;
  name: string;
  teamId: TeamId;
  officeId: string;
  /** Colour when grouped by team (the default view). */
  color: string;
  /** Colour when grouped by office. Both are dormant-aware, so the view can pick
   *  one without re-deriving the "no activity in 90 days" rule. */
  officeColor: string;
  r: number;
  receivedCents: number;
  isDormant: boolean;
}

export interface GraphLink {
  source: PersonId;
  target: PersonId;
  width: number;
  /** Giver's team colour. */
  color: string;
  /** Giver's office colour — used when the map is grouped by office, so an edge
   *  crossing between clusters is legible as coming from one side. */
  officeColor: string;
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
  /** Received zero kudos from anyone in the last 90 days — a coverage gap in the
   * org's reach, independent of whether this person has been giving. */
  unreached: { count: number; groups: ManagerActionGroup[] };
  /** Peers have recognised them recently but their manager hasn't — a manager
   * engagement gap, distinct from `unreached` (nobody has reached them at all). */
  managerGap: {
    count: number;
    groups: ManagerActionGroup[];
    example: { person: Person; manager: Person; peerGivers: number } | null;
  };
  /** In-degree relative to team size — the same absolute support load lands
   * heavier on a small team than a large one, which is what makes it a risk
   * signal rather than just a restatement of `mostReliedOn`. */
  overloadRisk: {
    count: number;
    top: { person: Person; distinctGivers: number; teamSize: number } | null;
  };
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
  /** Recognition across office lines. Participation and claim rate both look
   *  healthy company-wide while a whole site goes unreached, because every other
   *  metric averages the sites together. This is the one that separates them. */
  crossOffice: {
    totalCrossings: number;
    offices: OfficeReach[];
    /** Lowest-coverage office with more than a handful of people — the one worth
     *  pointing at. Null when there is only one office. */
    worst: OfficeReach | null;
  };
}

export interface OfficeReach {
  office: Office;
  headcount: number;
  reached: number;
  ratio: number;
  /** Kudos that arrived from another office. */
  inbound: number;
  /** Kudos its people sent to another office. */
  outbound: number;
  /** Who sent the most of that inbound — "three of them came from one person". */
  topInboundSender: { person: Person; count: number } | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Insights are always computed from the full company-wide dataset — they describe
 * fixed facts about the org, independent of the graph's current filter/toggle state. */
function computeInsights(people: Person[], teams: Team[], kudos: Kudo[], offices: Office[]): GraphInsights {
  const personById = (personId: PersonId): Person => people.find((p) => p.id === personId)!;
  const managerOf = (person: Person): Person | null => (person.managerId ? personById(person.managerId) : null);
  /** The one person on a team with no manager of their own. */
  const managerOfTeam = (teamId: TeamId): Person => people.find((p) => p.teamId === teamId && p.managerId === null)!;

  /** Groups people needing follow-up by who to actually contact: their manager.
   * Anyone with no manager on file (a team lead themselves) is defensively skipped —
   * none of the current risk cohorts include a team lead, but a future data edit
   * shouldn't silently misattribute the group if one ever does. */
  function groupByManager(subset: Person[]): ManagerActionGroup[] {
    const byManager = new Map<PersonId, ManagerActionGroup>();
    for (const person of subset) {
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

  const recentCutoff = TODAY.getTime() - DORMANT_DAYS * 24 * 60 * 60 * 1000;

  /** Received zero kudos in the last 90 days — ignores whether they've been giving. */
  function hasNoRecentRecognition(personId: PersonId): boolean {
    return !kudos.some((k) => k.toId === personId && new Date(k.sentAt).getTime() > recentCutoff);
  }

  const realKudos = kudos.filter((k) => k.fromId !== k.toId);

  const unreachedPeople = people.filter((p) => hasNoRecentRecognition(p.id));

  // managerGap: peers have recognised them recently, but their manager hasn't
  const managerGapEntries: { person: Person; manager: Person; peerGivers: number }[] = [];
  for (const person of people) {
    const manager = managerOf(person);
    if (!manager) continue;
    const recentGivers = new Set(
      kudos.filter((k) => k.toId === person.id && new Date(k.sentAt).getTime() > recentCutoff).map((k) => k.fromId),
    );
    if (recentGivers.has(manager.id)) continue;
    if (recentGivers.size >= 2) managerGapEntries.push({ person, manager, peerGivers: recentGivers.size });
  }
  managerGapEntries.sort((a, b) => b.peerGivers - a.peerGivers);

  // overloadRisk: in-degree (distinct givers) divided by team size, so the same
  // support load ranks as riskier on a small team than a large one
  const overloadRatios = people
    .map((person) => {
      const distinctGivers = new Set(
        kudos.filter((k) => k.toId === person.id && k.fromId !== person.id).map((k) => k.fromId),
      ).size;
      const teamSize = Math.max(1, people.filter((p) => p.teamId === person.teamId).length - 1);
      return { person, distinctGivers, teamSize, ratio: distinctGivers / teamSize };
    })
    .sort((a, b) => b.ratio - a.ratio);
  const overloadCount = Math.max(1, Math.round(people.length * 0.175));

  // mostReliedOn: highest distinct-giver count, + how many teams those givers span
  let mostReliedOn = { person: people[0], distinctGivers: -1, teamsSpanned: 0 };
  for (const person of people) {
    const givers = kudos.filter((k) => k.toId === person.id).map((k) => k.fromId);
    const distinctGivers = new Set(givers).size;
    if (distinctGivers > mostReliedOn.distinctGivers) {
      const teamsSpanned = new Set(givers.map((id) => personById(id).teamId)).size;
      mostReliedOn = { person, distinctGivers, teamsSpanned };
    }
  }

  // connector: highest count of distinct teams sent into
  let connector = { person: people[0], teamsSentInto: -1 };
  for (const person of people) {
    const recipients = kudos.filter((k) => k.fromId === person.id).map((k) => k.toId);
    const teamsSentInto = new Set(recipients.map((id) => personById(id).teamId)).size;
    if (teamsSentInto > connector.teamsSentInto) connector = { person, teamsSentInto };
  }

  // mostClosedTeam: highest ratio of intra-team out-edges to total out-edges
  let mostClosedTeam = { team: teams[0], ratio: -1 };
  for (const team of teams) {
    const memberIds = new Set(people.filter((p) => p.teamId === team.id).map((p) => p.id));
    const out = kudos.filter((k) => memberIds.has(k.fromId));
    if (out.length === 0) continue;
    const intra = out.filter((k) => memberIds.has(k.toId));
    const ratio = intra.length / out.length;
    if (ratio > mostClosedTeam.ratio) mostClosedTeam = { team, ratio };
  }

  // pairTotals: combined two-way kudos value per distinct pair — feeds strongestBond
  const pairTotals = new Map<string, number>();
  for (const k of realKudos) {
    const [a, b] = [k.fromId, k.toId].sort();
    const key = `${a}|${b}`;
    pairTotals.set(key, (pairTotals.get(key) ?? 0) + k.amountCents);
  }

  // crossTeamRatio: org-wide share of edges that cross a team boundary
  const crossEdges = realKudos.filter((k) => personById(k.fromId).teamId !== personById(k.toId).teamId);
  const crossTeamRatio = realKudos.length > 0 ? crossEdges.length / realKudos.length : 0;

  // receiveOnly: received at least once, never gave
  const receiveOnlyPeople = people.filter((p) => {
    const gave = kudos.some((k) => k.fromId === p.id);
    const received = kudos.some((k) => k.toId === p.id);
    return received && !gave;
  });

  // singleSource: every kudo they've received came from the same one person
  const singleSourcePeople = people.filter((p) => {
    const givers = new Set(kudos.filter((k) => k.toId === p.id).map((k) => k.fromId));
    return givers.size === 1;
  });

  // fragileBridges: team pairs connected by exactly one person on each side
  let fragileCount = 0;
  let totalConnectedPairs = 0;
  let fragileExample: GraphInsights['fragileBridges']['example'] = null;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const teamA = teams[i];
      const teamB = teams[j];
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
          const bridgePeople: [Person, Person] = [personById(distinctBridgers[0]), personById(distinctBridgers[1])];
          fragileExample = {
            teamA,
            teamB,
            people: bridgePeople,
            managers: [managerOfTeam(bridgePeople[0].teamId), managerOfTeam(bridgePeople[1].teamId)],
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

  const officeOf = (id: PersonId) => personById(id).officeId;
  const officeReach: OfficeReach[] = offices.map((office) => {
    const members = people.filter((p) => p.officeId === office.id);
    const memberIds = new Set(members.map((p) => p.id));
    const reached = members.filter((p) => realKudos.some((k) => k.toId === p.id)).length;
    const inboundKudos = realKudos.filter(
      (k) => memberIds.has(k.toId) && !memberIds.has(k.fromId),
    );
    const senderCounts = new Map<PersonId, number>();
    for (const k of inboundKudos) senderCounts.set(k.fromId, (senderCounts.get(k.fromId) ?? 0) + 1);
    const top = [...senderCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      office,
      headcount: members.length,
      reached,
      ratio: members.length > 0 ? reached / members.length : 0,
      inbound: inboundKudos.length,
      outbound: realKudos.filter((k) => memberIds.has(k.fromId) && !memberIds.has(k.toId)).length,
      topInboundSender: top ? { person: personById(top[0]), count: top[1] } : null,
    };
  });
  const totalCrossings = realKudos.filter((k) => officeOf(k.fromId) !== officeOf(k.toId)).length;
  const worst =
    officeReach.length > 1
      ? [...officeReach].sort((a, b) => a.ratio - b.ratio)[0]
      : null;

  return {
    mostReliedOn,
    connector,
    mostClosedTeam: { ...mostClosedTeam, manager: managerOfTeam(mostClosedTeam.team.id) },
    unreached: { count: unreachedPeople.length, groups: groupByManager(unreachedPeople) },
    managerGap: {
      count: managerGapEntries.length,
      groups: groupByManager(managerGapEntries.map((e) => e.person)),
      example: managerGapEntries[0] ?? null,
    },
    overloadRisk: {
      count: overloadCount,
      top: overloadRatios[0]
        ? { person: overloadRatios[0].person, distinctGivers: overloadRatios[0].distinctGivers, teamSize: overloadRatios[0].teamSize }
        : null,
    },
    crossTeamRatio,
    receiveOnly: { count: receiveOnlyPeople.length, groups: groupByManager(receiveOnlyPeople) },
    singleSource: { count: singleSourcePeople.length, groups: groupByManager(singleSourcePeople) },
    fragileBridges: { count: fragileCount, totalConnectedPairs, example: fragileExample },
    strongestBond,
    crossOffice: { totalCrossings, offices: officeReach, worst },
  };
}

/** Not a React hook (no internal state/effects) — just named to match the rest of
 * the derivation layer. Safe to call conditionally, e.g. after a loading guard. */
export function buildKudosGraph({
  people,
  teams,
  kudos,
  crossTeamOnly,
  teamFilter,
  offices,
}: {
  people: Person[];
  teams: Team[];
  kudos: Kudo[];
  crossTeamOnly: boolean;
  teamFilter: TeamId | 'all';
  offices: Office[];
}) {
  const teamById = (teamId: TeamId): Team => teams.find((t) => t.id === teamId)!;
  const officeById = (id: string): Office | undefined => offices.find((o) => o.id === id);

  function isDormant(personId: PersonId): boolean {
    const cutoff = TODAY.getTime() - DORMANT_DAYS * 24 * 60 * 60 * 1000;
    return !kudos.some(
      (k) => (k.fromId === personId || k.toId === personId) && new Date(k.sentAt).getTime() > cutoff,
    );
  }

  const scopedPeople = teamFilter === 'all' ? people : people.filter((p) => p.teamId === teamFilter);
  const peopleIds = new Set(scopedPeople.map((p) => p.id));

  const nodes: GraphNode[] = scopedPeople.map((person) => {
    const receivedCents = kudos.filter((k) => k.toId === person.id).reduce((s, k) => s + k.amountCents, 0);
    const dormant = isDormant(person.id);
    return {
      id: person.id,
      name: person.name.split(' ')[0],
      teamId: person.teamId,
      officeId: person.officeId,
      // Colour is the office, not the team: the demo's whole point is that the
      // gap runs along the office line, and that has to be visible at a glance.
      color: dormant ? DORMANT_COLOR : teamById(person.teamId).color,
      officeColor: dormant
        ? DORMANT_COLOR
        : (officeById(person.officeId)?.color ?? teamById(person.teamId).color),
      r: clamp(3 + Math.sqrt(receivedCents / 100) * 0.5, 3, 9),
      receivedCents,
      isDormant: dormant,
    };
  });

  const aggregated = new Map<
    string,
    { source: PersonId; target: PersonId; amount: number; color: string; officeColor: string }
  >();
  for (const k of kudos) {
    if (k.fromId === k.toId) continue;
    if (!peopleIds.has(k.fromId) || !peopleIds.has(k.toId)) continue;
    if (crossTeamOnly) {
      const fromTeam = people.find((p) => p.id === k.fromId)!.teamId;
      const toTeam = people.find((p) => p.id === k.toId)!.teamId;
      if (fromTeam === toTeam) continue;
    }
    const key = `${k.fromId}>${k.toId}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.amount += k.amountCents;
    } else {
      const giver = people.find((p) => p.id === k.fromId)!;
      aggregated.set(key, {
        source: k.fromId,
        target: k.toId,
        amount: k.amountCents,
        color: teamById(giver.teamId).color,
        officeColor: officeById(giver.officeId)?.color ?? teamById(giver.teamId).color,
      });
    }
  }

  const links: GraphLink[] = [...aggregated.values()].map((a) => ({
    source: a.source,
    target: a.target,
    width: clamp(1 + a.amount / 1500, 1, 3),
    color: a.color,
    officeColor: a.officeColor,
  }));

  return { nodes, links, insights: computeInsights(people, teams, kudos, offices) };
}

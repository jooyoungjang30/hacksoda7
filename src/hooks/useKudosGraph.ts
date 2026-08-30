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

export interface GraphInsights {
  mostReliedOn: { person: Person; distinctGivers: number; teamsSpanned: number };
  connector: { person: Person; teamsSentInto: number };
  mostClosedTeam: { team: Team; ratio: number };
  dormantCount: number;
  mutualPairRatio: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function teamById(teamId: TeamId): Team {
  return mockTeams.find((t) => t.id === teamId)!;
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
  const dormantCount = mockPeople.filter((p) => isDormant(p.id)).length;

  // mostReliedOn: highest distinct-giver count, + how many teams those givers span
  let mostReliedOn = { person: mockPeople[0], distinctGivers: -1, teamsSpanned: 0 };
  for (const person of mockPeople) {
    const givers = mockKudos.filter((k) => k.toId === person.id).map((k) => k.fromId);
    const distinctGivers = new Set(givers).size;
    if (distinctGivers > mostReliedOn.distinctGivers) {
      const teamsSpanned = new Set(givers.map((id) => mockPeople.find((p) => p.id === id)!.teamId)).size;
      mostReliedOn = { person, distinctGivers, teamsSpanned };
    }
  }

  // connector: highest count of distinct teams sent into
  let connector = { person: mockPeople[0], teamsSentInto: -1 };
  for (const person of mockPeople) {
    const recipients = mockKudos.filter((k) => k.fromId === person.id).map((k) => k.toId);
    const teamsSentInto = new Set(recipients.map((id) => mockPeople.find((p) => p.id === id)!.teamId)).size;
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
  for (const k of mockKudos) {
    if (k.fromId === k.toId) continue;
    const [a, b] = [k.fromId, k.toId].sort();
    pairs.add(`${a}|${b}`);
    directed.add(`${k.fromId}>${k.toId}`);
  }
  let mutualCount = 0;
  for (const pair of pairs) {
    const [a, b] = pair.split('|');
    if (directed.has(`${a}>${b}`) && directed.has(`${b}>${a}`)) mutualCount++;
  }
  const mutualPairRatio = pairs.size > 0 ? mutualCount / pairs.size : 0;

  return { mostReliedOn, connector, mostClosedTeam, dormantCount, mutualPairRatio };
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
      r: clamp(5 + Math.sqrt(receivedCents / 100) * 1.6, 5, 20),
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

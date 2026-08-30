import { TODAY } from './clock';
import { computeMemberStats } from './derive';
import type {
  Kudo,
  Person,
  PersonDetail,
  PersonDirectoryRow,
  PersonFlag,
  PersonId,
  RelationshipEdge,
  Team,
} from './types';

const UNREACHED_DAYS = 90;

function personById(id: PersonId, people: Person[]): Person {
  const person = people.find((p) => p.id === id);
  if (!person) throw new Error(`Unknown person id: ${id}`);
  return person;
}

function managerOf(person: Person, people: Person[]): Person | null {
  return person.managerId ? personById(person.managerId, people) : null;
}

/** Distinct colleagues this person has exchanged kudos with, either direction,
 * combined two-way value with each, sorted strongest first. Self-kudos excluded. */
function buildEdges(personId: PersonId, people: Person[], kudos: Kudo[]): RelationshipEdge[] {
  const totals = new Map<PersonId, { cents: number; gave: boolean; received: boolean }>();
  for (const k of kudos) {
    if (k.fromId === k.toId) continue;
    let otherId: PersonId | null = null;
    let gave = false;
    let received = false;
    if (k.fromId === personId) {
      otherId = k.toId;
      gave = true;
    } else if (k.toId === personId) {
      otherId = k.fromId;
      received = true;
    }
    if (!otherId) continue;
    const existing = totals.get(otherId) ?? { cents: 0, gave: false, received: false };
    existing.cents += k.amountCents;
    existing.gave = existing.gave || gave;
    existing.received = existing.received || received;
    totals.set(otherId, existing);
  }
  return [...totals.entries()]
    .map(([otherId, t]) => ({
      person: personById(otherId, people),
      totalCents: t.cents,
      direction: t.gave && t.received ? ('both' as const) : t.gave ? ('given' as const) : ('received' as const),
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

function hasRecentRecognition(personId: PersonId, kudos: Kudo[]): boolean {
  const cutoff = TODAY.getTime() - UNREACHED_DAYS * 24 * 60 * 60 * 1000;
  return kudos.some(
    (k) => k.toId === personId && k.fromId !== personId && new Date(k.sentAt).getTime() > cutoff,
  );
}

/** One flag per person, most actionable first. Mirrors the categories the Network
 * Map's HR Insights panel already surfaces — no new metric is invented here. */
function computeFlag(person: Person, edges: RelationshipEdge[], people: Person[], kudos: Kudo[]): PersonFlag {
  const gave = kudos.some((k) => k.fromId === person.id);
  const received = kudos.some((k) => k.toId === person.id);
  const givers = new Set(kudos.filter((k) => k.toId === person.id && k.fromId !== person.id).map((k) => k.fromId));

  if (received && !hasRecentRecognition(person.id, kudos)) return 'unreached';
  if (givers.size === 1) return 'single_source';
  if (received && !gave) return 'receive_only';

  const manager = managerOf(person, people);
  if (manager) {
    const cutoff = TODAY.getTime() - UNREACHED_DAYS * 24 * 60 * 60 * 1000;
    const recentGivers = new Set(
      kudos.filter((k) => k.toId === person.id && new Date(k.sentAt).getTime() > cutoff).map((k) => k.fromId),
    );
    if (recentGivers.size >= 2 && !recentGivers.has(manager.id)) return 'manager_gap';
  }

  if (edges.length > 0 && edges.every((e) => e.person.teamId === person.teamId)) return 'team_only';
  return null;
}

export function computePersonDirectory(people: Person[], _teams: Team[], kudos: Kudo[]): PersonDirectoryRow[] {
  return people
    .map((person) => {
      const edges = buildEdges(person.id, people, kudos);
      const receivedCents = edges.reduce((sum, e) => sum + (e.direction !== 'given' ? e.totalCents : 0), 0);
      const givenCents = edges.reduce((sum, e) => sum + (e.direction !== 'received' ? e.totalCents : 0), 0);
      const own = kudos.filter((k) => k.fromId === person.id || k.toId === person.id);
      const lastExchangeAt = own.length
        ? own.reduce((latest, k) => (k.sentAt > latest ? k.sentAt : latest), own[0].sentAt)
        : null;
      return {
        person,
        manager: managerOf(person, people),
        receivedCents,
        givenCents,
        connectionCount: edges.length,
        lastExchangeAt,
        flag: computeFlag(person, edges, people, kudos),
      };
    })
    .sort((a, b) => a.connectionCount - b.connectionCount || a.person.name.localeCompare(b.person.name));
}

export function computePersonDetail(
  personId: PersonId,
  people: Person[],
  kudos: Kudo[],
): PersonDetail | undefined {
  const person = people.find((p) => p.id === personId);
  if (!person) return undefined;

  const stats = computeMemberStats(personId, people, kudos);
  const manager = managerOf(person, people);
  const edges = buildEdges(personId, people, kudos);
  const managerLink = manager ? (edges.find((e) => e.person.id === manager.id) ?? null) : null;
  const connections = edges.filter((e) => e.person.id !== manager?.id);

  const exchanges = kudos
    .filter((k) => (k.fromId === personId || k.toId === personId) && k.fromId !== k.toId)
    .map((kudo) => ({
      kudo,
      direction: (kudo.fromId === personId ? 'out' : 'in') as 'out' | 'in',
      other: personById(kudo.fromId === personId ? kudo.toId : kudo.fromId, people),
    }))
    .sort((a, b) => (a.kudo.sentAt < b.kudo.sentAt ? 1 : -1));

  return { stats, manager, managerLink, connections, exchanges, flag: computeFlag(person, edges, people, kudos) };
}

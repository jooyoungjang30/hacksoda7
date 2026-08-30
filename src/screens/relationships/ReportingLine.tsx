import { Card, CardHeader } from '../../components/ui/Card';
import type { Person, RelationshipEdge, Team } from '../../lib/types';

const WIDTH = 386;
const HEIGHT = 410;
const CENTER = { x: WIDTH / 2, y: 190 };
const MANAGER_R = 128;
const CONNECTION_R = 140;
const MAX_SHOWN = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nodeRadius(cents: number): number {
  return clamp(7 + Math.sqrt(cents / 100) * 1.1, 8, 19);
}

function point(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER.x + radius * Math.sin(rad), y: CENTER.y - radius * Math.cos(rad) };
}

/** The unit that actually exists at Vega — one manager, one team, no deeper
 * hierarchy — so this draws that unit rather than a tree with nothing to nest.
 * Link weight (width + opacity) is the combined two-way kudos value on that edge. */
export function ReportingLine({
  person,
  manager,
  managerLink,
  connections,
  teams,
}: {
  person: Person;
  manager: Person | null;
  managerLink: RelationshipEdge | null;
  connections: RelationshipEdge[];
  teams: Team[];
}) {
  const teamColor = (teamId: string) => teams.find((t) => t.id === teamId)?.color ?? '#7C3AED';
  const shown = connections.slice(0, MAX_SHOWN);
  const overflow = connections.length - shown.length;
  const maxCents = Math.max(1, managerLink?.totalCents ?? 0, ...shown.map((c) => c.totalCents));

  const angleFor = (i: number) => (shown.length <= 1 ? 180 : 40 + i * ((320 - 40) / (shown.length - 1)));

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader title="Reporting line" sub="link weight = kudos exchanged" />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${person.name} at the centre. ${
          manager ? `Manager ${manager.name} above, connected by a ${managerLink ? 'weighted' : 'dashed grey, meaning no kudos exchanged,'} line.` : 'No manager on file.'
        } ${shown.length} colleagues around them, connected by lines weighted by kudos exchanged.`}
      >
        <g strokeLinecap="round" fill="none">
          {manager && (
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={point(MANAGER_R, 0).x}
              y2={point(MANAGER_R, 0).y}
              stroke={managerLink ? teamColor(manager.teamId) : '#C9C4D6'}
              strokeWidth={managerLink ? clamp(1.5 + (managerLink.totalCents / maxCents) * 3.5, 1.5, 5) : 2}
              strokeDasharray={managerLink ? undefined : '5 5'}
              opacity={managerLink ? clamp(0.4 + (managerLink.totalCents / maxCents) * 0.6, 0.4, 1) : 0.9}
            />
          )}
          {shown.map((c, i) => {
            const p = point(CONNECTION_R, angleFor(i));
            return (
              <line
                key={c.person.id}
                x1={CENTER.x}
                y1={CENTER.y}
                x2={p.x}
                y2={p.y}
                stroke={teamColor(c.person.teamId)}
                strokeWidth={clamp(1.5 + (c.totalCents / maxCents) * 3.5, 1.5, 5)}
                opacity={clamp(0.4 + (c.totalCents / maxCents) * 0.6, 0.4, 1)}
              />
            );
          })}
        </g>

        <g fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle">
          {manager && (
            <g>
              <circle cx={point(MANAGER_R, 0).x} cy={point(MANAGER_R, 0).y} r={17} fill={teamColor(manager.teamId)} opacity={0.9} />
              <text x={point(MANAGER_R, 0).x} y={point(MANAGER_R, 0).y + 3} fontSize={9} fontWeight={700} fill="#fff">
                {manager.initials}
              </text>
              <text x={point(MANAGER_R, 0).x} y={point(MANAGER_R, 0).y + 31} fontSize={9.5} fontWeight={600} fill="#2F2540">
                {manager.name.split(' ')[0]}
              </text>
              <text x={point(MANAGER_R, 0).x} y={point(MANAGER_R, 0).y + 43} fontSize={8.5} fill="#8A8F9C">
                manager
              </text>
            </g>
          )}

          {shown.map((c, i) => {
            const angle = angleFor(i);
            const p = point(CONNECTION_R, angle);
            const r = nodeRadius(c.totalCents);
            const labelBelow = angle > 90 && angle < 270;
            // Stack both lines on the same side of the node — above it, the value
            // line must go *further* from the node than the name, not back toward it.
            const dir = labelBelow ? 1 : -1;
            const nameY = p.y + dir * (r + 12);
            const valueY = nameY + dir * 12;
            return (
              <g key={c.person.id}>
                <circle cx={p.x} cy={p.y} r={r} fill={teamColor(c.person.teamId)} opacity={0.9} />
                <text x={p.x} y={nameY} fontSize={9.5} fontWeight={600} fill="#2F2540">
                  {c.person.name.split(' ')[0]}
                </text>
                <text x={p.x} y={valueY} fontSize={8.5} fill="#8A8F9C">
                  ${Math.round(c.totalCents / 100)} · {c.direction === 'both' ? 'both ways' : c.direction}
                </text>
              </g>
            );
          })}
        </g>

        <g>
          <rect x={CENTER.x - 47} y={CENTER.y - 22} width={94} height={44} rx={11} fill="#5B21B6" />
          <circle cx={CENTER.x - 25} cy={CENTER.y} r={13} fill="#fff" opacity={0.22} />
          <text
            x={CENTER.x - 25}
            y={CENTER.y + 4}
            fontFamily="IBM Plex Sans, sans-serif"
            fontSize={9}
            fontWeight={700}
            fill="#fff"
            textAnchor="middle"
          >
            {person.initials}
          </text>
          <text x={CENTER.x - 6} y={CENTER.y - 3} fontFamily="IBM Plex Sans, sans-serif" fontSize={11} fontWeight={600} fill="#fff">
            {person.name.split(' ')[0]}
          </text>
          <text x={CENTER.x - 6} y={CENTER.y + 10} fontFamily="IBM Plex Sans, sans-serif" fontSize={8.5} fill="#D8C7F7">
            {person.role}
          </text>
        </g>

        <text x={14} y={HEIGHT - 12} fontFamily="IBM Plex Sans, sans-serif" fontSize={8.5} fill="#8A8F9C">
          {manager ? 'Dashed grey = no kudos either way with their manager' : 'No manager on file'}
          {overflow > 0 ? ` · +${overflow} more not shown` : ''}
        </text>
      </svg>
    </Card>
  );
}

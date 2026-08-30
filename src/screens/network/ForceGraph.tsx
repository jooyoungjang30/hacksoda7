import type { GraphInsights, GraphLink, GraphNode } from '../../hooks/useKudosGraph';
import { useForceLayout } from './useForceLayout';

const WIDTH = 660;
const HEIGHT = 520;

export function ForceGraph({
  nodes,
  links,
  insights,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  insights: GraphInsights;
}) {
  const { positionedNodes, positionedLinks } = useForceLayout(nodes, links, WIDTH, HEIGHT);
  const connectorNode = positionedNodes.find((n) => n.id === insights.connector.person.id);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`Force-directed graph of kudos sent between ${positionedNodes.length} colleagues, clustered by team`}
    >
      <g strokeLinecap="round" fill="none">
        {positionedLinks.map((l, i) => (
          <line
            key={i}
            x1={l.source.x}
            y1={l.source.y}
            x2={l.target.x}
            y2={l.target.y}
            stroke={l.color}
            strokeWidth={l.width}
            opacity={0.4}
          />
        ))}
      </g>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize={8.5} fill="#5A5F6E" textAnchor="middle">
        {positionedNodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} />
            <text x={n.x} y={n.y + n.r + 11} fontSize={9} fill={n.isDormant ? '#9A94A8' : '#2F2540'}>
              {n.name}
            </text>
          </g>
        ))}
        {connectorNode && (
          <circle
            cx={connectorNode.x}
            cy={connectorNode.y}
            r={connectorNode.r + 6}
            fill="none"
            stroke="#C2185B"
            strokeWidth={1.4}
            strokeDasharray="4 4"
            opacity={0.8}
          />
        )}
      </g>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize={9} fill="#8A8F9C">
        <text x={16} y={HEIGHT - 16}>
          Grey nodes = no kudos given or received in 90 days
        </text>
      </g>
    </svg>
  );
}

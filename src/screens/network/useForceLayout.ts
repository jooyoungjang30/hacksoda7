import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import { useMemo } from 'react';
import type { GraphLink, GraphNode } from '../../hooks/useKudosGraph';
import type { TeamId } from '../../lib/types';

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

export interface PositionedLink {
  source: PositionedNode;
  target: PositionedNode;
  width: number;
  color: string;
}

const TEAM_ORDER: TeamId[] = ['engineering', 'design', 'marketing', 'sales', 'people-ops', 'finance'];

function teamCentroids(width: number, height: number): Record<TeamId, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;
  const centroids = {} as Record<TeamId, { x: number; y: number }>;
  TEAM_ORDER.forEach((id, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / TEAM_ORDER.length;
    centroids[id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  return centroids;
}

/** Runs d3-force synchronously, once. No tick-loop animation — 24 static nodes don't
 * need it, and it would only cost React re-render churn. */
export function useForceLayout(nodes: GraphNode[], links: GraphLink[], width: number, height: number) {
  return useMemo(() => {
    const centroids = teamCentroids(width, height);

    // d3-force mutates its inputs and replaces link.source/target string ids with
    // node object references — always pass deep copies, never the memoized derived data.
    interface SimNode extends GraphNode {
      x: number;
      y: number;
    }
    const nodeCopies: SimNode[] = nodes.map((n) => ({ ...n, x: 0, y: 0 }));
    const linkCopies = links.map((l) => ({ ...l })) as unknown as Array<{
      source: string | SimNode;
      target: string | SimNode;
      width: number;
      color: string;
    }>;

    forceSimulation(nodeCopies)
      .force(
        'link',
        forceLink(linkCopies)
          .id((d) => (d as SimNode).id)
          .distance(60)
          .strength(0.35),
      )
      .force('charge', forceManyBody().strength(-180))
      .force('collide', forceCollide((d) => (d as SimNode).r + 6))
      .force(
        'x',
        forceX<SimNode>((d) => centroids[d.teamId]?.x ?? width / 2).strength(0.12),
      )
      .force(
        'y',
        forceY<SimNode>((d) => centroids[d.teamId]?.y ?? height / 2).strength(0.12),
      )
      .stop()
      .tick(300);

    const positionedLinks: PositionedLink[] = linkCopies.map((l) => ({
      source: l.source as SimNode,
      target: l.target as SimNode,
      width: l.width,
      color: l.color,
    }));

    return { positionedNodes: nodeCopies as PositionedNode[], positionedLinks };
  }, [nodes, links, width, height]);
}

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GraphLink, GraphNode } from '../../hooks/useKudosGraph';
import type { TeamId } from '../../lib/types';

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

export interface PositionedLink {
  source: PositionedNode;
  target: PositionedNode;
  width: number;
  color: string;
  officeColor: string;
}

const TEAM_ORDER: TeamId[] = ['engineering', 'design', 'marketing', 'sales', 'people-ops', 'finance'];

export type ClusterBy = 'team' | 'office';

/**
 * Offices sit side by side on the x-axis rather than on a ring: with two sites the
 * gap between them IS the finding, and a horizontal split reads as "these are two
 * places" far more directly than two arcs of a circle. Largest office goes left so
 * the layout is stable when the data changes.
 */
function officeCentroids(
  nodes: GraphNode[],
  width: number,
  height: number,
): Record<string, { x: number; y: number }> {
  const counts = new Map<string, number>();
  for (const n of nodes) counts.set(n.officeId, (counts.get(n.officeId) ?? 0) + 1);
  const ids = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);

  const out: Record<string, { x: number; y: number }> = {};
  const span = width * 0.62;
  const left = width / 2 - span / 2;
  ids.forEach((id, i) => {
    out[id] = {
      x: ids.length === 1 ? width / 2 : left + (span * i) / (ids.length - 1),
      y: height / 2,
    };
  });
  return out;
}

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

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    ? (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false)
    : false;
}

/**
 * Force layout with an optional live simulation.
 *
 * The settled layout is computed synchronously in `useMemo` — deterministic, and it
 * means the graph is fully positioned on first paint (and during server rendering).
 * An effect then nudges the nodes outward and hands them to a running simulation, so
 * they visibly converge into their clusters instead of appearing pre-arranged. That
 * intro, and the warm simulation that makes nodes draggable, are both skipped when
 * the viewer prefers reduced motion.
 */
export function useForceLayout(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  clusterBy: ClusterBy = 'team',
) {
  // Clustering by office needs a firmer pull: two groups with a wide gap only
  // read as separate if the force is strong enough to beat the link springs.
  const anchor = (() => {
    const teams = teamCentroids(width, height);
    const officesXY = officeCentroids(nodes, width, height);
    return clusterBy === 'office'
      ? {
          x: (d: PositionedNode) => officesXY[d.officeId]?.x ?? width / 2,
          y: (d: PositionedNode) => officesXY[d.officeId]?.y ?? height / 2,
          strength: 0.34,
        }
      : {
          x: (d: PositionedNode) => teams[d.teamId]?.x ?? width / 2,
          y: (d: PositionedNode) => teams[d.teamId]?.y ?? height / 2,
          strength: 0.12,
        };
  })();

  const [, setFrame] = useState(0);
  const simRef = useRef<Simulation<PositionedNode, undefined> | null>(null);

  const { positionedNodes, positionedLinks } = useMemo(() => {
    // d3-force mutates its inputs and replaces link.source/target string ids with
    // node object references — always pass deep copies, never the memoized derived data.
    const nodeCopies: PositionedNode[] = nodes.map((n) => ({ ...n, x: 0, y: 0 }));
    const linkCopies = links.map((l) => ({ ...l })) as unknown as Array<{
      source: string | PositionedNode;
      target: string | PositionedNode;
      width: number;
      color: string;
      officeColor: string;
    }>;

    forceSimulation(nodeCopies)
      .force(
        'link',
        forceLink(linkCopies)
          .id((d) => (d as PositionedNode).id)
          .distance(60)
          .strength(0.35),
      )
      .force('charge', forceManyBody().strength(-180))
      .force('collide', forceCollide((d) => (d as PositionedNode).r + 9))
      .force('x', forceX<PositionedNode>(anchor.x).strength(anchor.strength))
      .force('y', forceY<PositionedNode>(anchor.y).strength(anchor.strength))
      .stop()
      .tick(300);

    const built: PositionedLink[] = linkCopies.map((l) => ({
      source: l.source as PositionedNode,
      target: l.target as PositionedNode,
      width: l.width,
      color: l.color,
      officeColor: l.officeColor,
    }));

    return { positionedNodes: nodeCopies, positionedLinks: built };
  }, [nodes, links, width, height, clusterBy]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const cx = width / 2;
    const cy = height / 2;

    // Push everything outward from centre so the settle is visible, rather than the
    // graph appearing already resolved.
    for (const n of positionedNodes) {
      n.x = cx + (n.x - cx) * 1.45;
      n.y = cy + (n.y - cy) * 1.45;
    }

    const sim = forceSimulation(positionedNodes)
      .force(
        'link',
        forceLink(positionedLinks as never[])
          .id((d) => (d as PositionedNode).id)
          .distance(60)
          .strength(0.35),
      )
      .force('charge', forceManyBody().strength(-180))
      .force('collide', forceCollide((d) => (d as PositionedNode).r + 9))
      .force('x', forceX<PositionedNode>(anchor.x).strength(anchor.strength))
      .force('y', forceY<PositionedNode>(anchor.y).strength(anchor.strength))
      .alpha(0.9)
      .alphaDecay(0.035)
      .on('tick', () => setFrame((f) => f + 1));

    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [positionedNodes, positionedLinks, width, height, clusterBy]);

  /** Pin a node under the pointer and keep the simulation warm while it moves. */
  function dragStart(node: PositionedNode) {
    node.fx = node.x;
    node.fy = node.y;
    simRef.current?.alphaTarget(0.25).restart();
  }

  function dragMove(node: PositionedNode, x: number, y: number) {
    node.fx = x;
    node.fy = y;
    if (!simRef.current) {
      // Reduced motion: no live simulation, so move the node directly.
      node.x = x;
      node.y = y;
      setFrame((f) => f + 1);
    }
  }

  function dragEnd(node: PositionedNode) {
    node.fx = null;
    node.fy = null;
    simRef.current?.alphaTarget(0);
  }

  return { positionedNodes, positionedLinks, dragStart, dragMove, dragEnd };
}

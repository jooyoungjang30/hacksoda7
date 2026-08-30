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
export function useForceLayout(nodes: GraphNode[], links: GraphLink[], width: number, height: number) {
  const [, setFrame] = useState(0);
  const simRef = useRef<Simulation<PositionedNode, undefined> | null>(null);

  const { positionedNodes, positionedLinks } = useMemo(() => {
    const centroids = teamCentroids(width, height);

    // d3-force mutates its inputs and replaces link.source/target string ids with
    // node object references — always pass deep copies, never the memoized derived data.
    const nodeCopies: PositionedNode[] = nodes.map((n) => ({ ...n, x: 0, y: 0 }));
    const linkCopies = links.map((l) => ({ ...l })) as unknown as Array<{
      source: string | PositionedNode;
      target: string | PositionedNode;
      width: number;
      color: string;
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
      .force(
        'x',
        forceX<PositionedNode>((d) => centroids[d.teamId]?.x ?? width / 2).strength(0.12),
      )
      .force(
        'y',
        forceY<PositionedNode>((d) => centroids[d.teamId]?.y ?? height / 2).strength(0.12),
      )
      .stop()
      .tick(300);

    const built: PositionedLink[] = linkCopies.map((l) => ({
      source: l.source as PositionedNode,
      target: l.target as PositionedNode,
      width: l.width,
      color: l.color,
    }));

    return { positionedNodes: nodeCopies, positionedLinks: built };
  }, [nodes, links, width, height]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const centroids = teamCentroids(width, height);
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
      .force(
        'x',
        forceX<PositionedNode>((d) => centroids[d.teamId]?.x ?? cx).strength(0.12),
      )
      .force(
        'y',
        forceY<PositionedNode>((d) => centroids[d.teamId]?.y ?? cy).strength(0.12),
      )
      .alpha(0.9)
      .alphaDecay(0.035)
      .on('tick', () => setFrame((f) => f + 1));

    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [positionedNodes, positionedLinks, width, height]);

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

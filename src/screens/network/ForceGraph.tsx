import { useMemo, useRef, useState } from 'react';
import type { GraphInsights, GraphLink, GraphNode } from '../../hooks/useKudosGraph';
import { useForceLayout, type PositionedNode } from './useForceLayout';
import { useZoomPan } from './useZoomPan';

// Square-ish: the map now sits in a half-width column with the legend below it
// rather than beside it, so it has more vertical room than the old widescreen card.
// Sized generously so the force layout (see useForceLayout) has room to space
// nodes and links out rather than crowding them toward the centre.
const WIDTH = 900;
const HEIGHT = 850;

// Dark canvas, Obsidian-style: the graph reads as a viewport into the data rather
// than another white card, and the team colours carry far better on it.
const CANVAS = '#14121C';
const GRID = '#241F33';

export function ForceGraph({
  nodes,
  links,
  insights,
  onNodeClick,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  insights: GraphInsights;
  onNodeClick?: (id: string) => void;
}) {
  const { positionedNodes, positionedLinks, dragStart, dragMove, dragEnd } = useForceLayout(
    nodes,
    links,
    WIDTH,
    HEIGHT,
  );
  const { svgRef, toSvg, view, scale, panning, isDefault, zoomIn, zoomOut, reset, handlers } =
    useZoomPan(WIDTH, HEIGHT);

  const [hovered, setHovered] = useState<string | null>(null);
  const dragging = useRef<PositionedNode | null>(null);
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);

  const connectorNode = positionedNodes.find((n) => n.id === insights.connector.person.id);

  // Neighbours of the hovered node — everything else dims, which is the one Obsidian
  // interaction that actually answers a question here: who does this person exchange
  // kudos with?
  const neighbours = useMemo(() => {
    if (!hovered) return null;
    const set = new Set<string>([hovered]);
    for (const l of positionedLinks) {
      if (l.source.id === hovered) set.add(l.target.id);
      if (l.target.id === hovered) set.add(l.source.id);
    }
    return set;
  }, [hovered, positionedLinks]);

  const k = 1 / scale;
  const dim = (id: string) => (neighbours && !neighbours.has(id) ? 0.15 : 1);
  const linkDim = (l: (typeof positionedLinks)[number]) =>
    !neighbours ? 0.34 : neighbours.has(l.source.id) && neighbours.has(l.target.id) ? 0.9 : 0.06;

  function onNodePointerDown(e: React.PointerEvent, node: PositionedNode) {
    e.stopPropagation(); // don't start a canvas pan
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragging.current = node;
    pointerDownAt.current = { x: e.clientX, y: e.clientY };
    dragStart(node);
  }

  function onNodePointerMove(e: React.PointerEvent) {
    const node = dragging.current;
    if (!node) return;
    e.stopPropagation();
    const { x, y } = toSvg(e.clientX, e.clientY);
    dragMove(node, x, y);
  }

  function onNodePointerUp(e: React.PointerEvent) {
    const node = dragging.current;
    if (!node) return;
    e.stopPropagation();
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    dragEnd(node);
    dragging.current = null;

    // A drag that never moved is a click — anything more than a few px was a
    // deliberate reposition, not an attempt to open this person.
    const start = pointerDownAt.current;
    pointerDownAt.current = null;
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 4) {
      onNodeClick?.(node.id);
    }
  }

  return (
    <div className="relative" style={{ background: CANVAS }}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className={`block h-auto w-full touch-none ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
        role="img"
        aria-label={`Force-directed graph of kudos sent between ${positionedNodes.length} colleagues, clustered by team. Scroll to zoom, drag to pan, drag a node to move it.`}
        {...handlers}
      >
        <defs>
          <pattern id="graph-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke={GRID} strokeWidth="1" />
          </pattern>
          <radialGradient id="node-halo">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid is drawn far larger than the viewBox so it still fills the frame when panned. */}
        <rect x={-3000} y={-3000} width={9000} height={9000} fill={CANVAS} />
        <rect x={-3000} y={-3000} width={9000} height={9000} fill="url(#graph-grid)" opacity={0.5} />

        <g strokeLinecap="round" fill="none">
          {positionedLinks.map((l, i) => (
            <line
              key={i}
              x1={l.source.x}
              y1={l.source.y}
              x2={l.target.x}
              y2={l.target.y}
              stroke={l.color}
              strokeWidth={l.width * k}
              opacity={linkDim(l)}
              style={{ transition: 'opacity 160ms ease' }}
            />
          ))}
        </g>

        <g fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle">
          {positionedNodes.map((n) => {
            const focused = hovered === n.id;
            return (
              <g
                key={n.id}
                opacity={dim(n.id)}
                style={{ transition: 'opacity 160ms ease', cursor: 'pointer' }}
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onPointerDown={(e) => onNodePointerDown(e, n)}
                onPointerMove={onNodePointerMove}
                onPointerUp={onNodePointerUp}
                onPointerCancel={onNodePointerUp}
              >
                {/* Halo: cheap glow that reads on the dark ground without an SVG filter. */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + (focused ? 12 : 7)}
                  fill="url(#node-halo)"
                  opacity={n.isDormant ? 0.12 : focused ? 0.5 : 0.22}
                  style={{ transition: 'opacity 160ms ease' }}
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={n.color}
                  stroke={focused ? '#fff' : 'rgba(255,255,255,0.25)'}
                  strokeWidth={(focused ? 2 : 1) * k}
                />
                <text
                  x={n.x}
                  y={n.y + n.r + 13 * k}
                  fontSize={11 * k}
                  fill={focused ? '#fff' : n.isDormant ? '#6E6880' : '#B9B2C9'}
                  fontWeight={focused ? 600 : 400}
                >
                  {n.name}
                </text>
              </g>
            );
          })}

          {connectorNode && (
            <circle
              cx={connectorNode.x}
              cy={connectorNode.y}
              r={connectorNode.r + 5 * k}
              fill="none"
              stroke="#F4739E"
              strokeWidth={1.4 * k}
              strokeDasharray={`${4 * k} ${4 * k}`}
              opacity={0.85}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {/* Zoom toolbar — pinned top-right, above the canvas, so it reads as a control
          rather than a caption. */}
      <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1">
        {!isDefault && (
          <button
            type="button"
            onClick={reset}
            className="pointer-events-auto rounded-md border border-[#332C45] bg-[#1E1A2B] px-2.5 py-1.5 text-[11px] font-medium text-[#B9B2C9] shadow-sm hover:bg-[#282136]"
          >
            Reset
          </button>
        )}
        <span className="pointer-events-auto rounded-md border border-[#332C45] bg-[#1E1A2B] px-2.5 py-1.5 text-[11px] text-[#8A8399] tabular-nums shadow-sm">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Zoom out"
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md border border-[#332C45] bg-[#1E1A2B] text-[15px] leading-none font-semibold text-[#B9B2C9] shadow-sm hover:bg-[#282136]"
        >
          −
        </button>
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Zoom in"
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md border border-[#332C45] bg-[#1E1A2B] text-[15px] leading-none font-semibold text-[#B9B2C9] shadow-sm hover:bg-[#282136]"
        >
          +
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-2.5 left-3 text-[9px] text-[#6E6880]">
        Scroll to zoom · drag canvas to pan · drag a node to move it
      </div>
    </div>
  );
}

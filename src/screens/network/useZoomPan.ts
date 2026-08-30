import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const WHEEL_STEP = 1.15;
const BUTTON_STEP = 1.4;

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Zoom and pan for an SVG, driven entirely by its viewBox — no transform on the
 * content, so stroke widths and font sizes scale with the view the way a map does.
 *
 * Zoom is anchored at the pointer: the point under the cursor stays put, which is
 * what makes wheel-zoom feel like it is following you rather than jumping to centre.
 */
export function useZoomPan(width: number, height: number) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: width, h: height });
  const [panning, setPanning] = useState(false);
  const panStart = useRef<{ px: number; py: number; view: ViewBox } | null>(null);

  // Reset when the graph's own dimensions change (e.g. a filter changes the layout).
  useEffect(() => {
    setView({ x: 0, y: 0, w: width, h: height });
  }, [width, height]);

  const clampWidth = useCallback(
    (w: number) => Math.min(width / MIN_SCALE, Math.max(width / MAX_SCALE, w)),
    [width],
  );

  /** Zoom by `factor` about a point given in client coordinates. */
  const zoomAbout = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      setView((v) => {
        const nextW = clampWidth(v.w * factor);
        const applied = nextW / v.w;
        const nextH = v.h * applied;

        // Default to the centre when no pointer position is supplied (the buttons).
        let fx = v.x + v.w / 2;
        let fy = v.y + v.h / 2;
        if (rect && clientX !== undefined && clientY !== undefined && rect.width > 0) {
          fx = v.x + ((clientX - rect.left) / rect.width) * v.w;
          fy = v.y + ((clientY - rect.top) / rect.height) * v.h;
        }

        return {
          x: fx - (fx - v.x) * applied,
          y: fy - (fy - v.y) * applied,
          w: nextW,
          h: nextH,
        };
      });
    },
    [clampWidth],
  );

  // Registered manually because React's onWheel is passive — preventDefault there
  // is a no-op, and the page would scroll while zooming.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      zoomAbout(e.deltaY < 0 ? 1 / WHEEL_STEP : WHEEL_STEP, e.clientX, e.clientY);
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAbout]);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    // Optional: pointer capture is absent in some environments (jsdom), and losing
    // it only costs us drags that leave the element mid-gesture.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    panStart.current = { px: e.clientX, py: e.clientY, view };
    setPanning(true);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const start = panStart.current;
    if (!start) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const dx = ((e.clientX - start.px) / rect.width) * start.view.w;
    const dy = ((e.clientY - start.py) / rect.height) * start.view.h;
    setView({ ...start.view, x: start.view.x - dx, y: start.view.y - dy });
  }

  function endPan(e: React.PointerEvent<SVGSVGElement>) {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
    panStart.current = null;
    setPanning(false);
  }

  const scale = width / view.w;

  /** Convert client coordinates to the SVG's user space, honouring the current view. */
  const toSvg = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return { x: clientX, y: clientY };
      return {
        x: view.x + ((clientX - rect.left) / rect.width) * view.w,
        y: view.y + ((clientY - rect.top) / rect.height) * view.h,
      };
    },
    [view],
  );

  return {
    svgRef,
    toSvg,
    view,
    scale,
    panning,
    isDefault: Math.abs(scale - 1) < 0.001 && view.x === 0 && view.y === 0,
    zoomIn: () => zoomAbout(1 / BUTTON_STEP),
    zoomOut: () => zoomAbout(BUTTON_STEP),
    reset: () => setView({ x: 0, y: 0, w: width, h: height }),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPan,
      onPointerCancel: endPan,
    },
  };
}

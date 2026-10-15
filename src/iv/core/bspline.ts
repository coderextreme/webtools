/**
 * InterViews Uniform Cubic B-Spline Curve Evaluator
 * Ported from src/InterViews/bspline.c and src/IV-2_6/bspline.c in ivtools
 * Evaluates open and closed B-splines to smooth polygon approximations
 * and computes cubic Bézier segments for canvas & SVG rendering.
 */

import { Point } from './transformer';

export interface BezierSegment {
  p0: Point;
  cp1: Point;
  cp2: Point;
  p1: Point;
}

/**
 * Converts a set of B-spline control points into cubic Bézier segments.
 * In uniform cubic B-spline representation:
 * Given control points P_{i-1}, P_i, P_{i+1}, P_{i+2}, the curve segment is:
 * B0 = (P_{i-1} + 4*P_i + P_{i+1}) / 6
 * B1 = (2*P_i + P_{i+1}) / 3
 * B2 = (P_i + 2*P_{i+1}) / 3
 * B3 = (P_i + 4*P_{i+1} + P_{i+2}) / 6
 */
export function bsplineToBeziers(controlPoints: Point[], closed = false): BezierSegment[] {
  const n = controlPoints.length;
  if (n < 2) return [];

  if (n === 2) {
    // Degenerate line segment
    return [
      {
        p0: controlPoints[0],
        cp1: controlPoints[0],
        cp2: controlPoints[1],
        p1: controlPoints[1],
      },
    ];
  }

  const segments: BezierSegment[] = [];

  if (closed) {
    // Wrap around for closed B-splines
    for (let i = 0; i < n; i++) {
      const p_prev = controlPoints[(i - 1 + n) % n];
      const p_curr = controlPoints[i];
      const p_next = controlPoints[(i + 1) % n];
      const p_next2 = controlPoints[(i + 2) % n];

      const b0 = {
        x: (p_prev.x + 4 * p_curr.x + p_next.x) / 6,
        y: (p_prev.y + 4 * p_curr.y + p_next.y) / 6,
      };
      const b1 = {
        x: (2 * p_curr.x + p_next.x) / 3,
        y: (2 * p_curr.y + p_next.y) / 3,
      };
      const b2 = {
        x: (p_curr.x + 2 * p_next.x) / 3,
        y: (p_curr.y + 2 * p_next.y) / 3,
      };
      const b3 = {
        x: (p_curr.x + 4 * p_next.x + p_next2.x) / 6,
        y: (p_curr.y + 4 * p_next.y + p_next2.y) / 6,
      };

      segments.push({ p0: b0, cp1: b1, cp2: b2, p1: b3 });
    }
  } else {
    // Open B-spline with clamped endpoints (triple multiplicity at ends)
    // Create augmented control points with clamped endpoints:
    const pts: Point[] = [
      controlPoints[0],
      controlPoints[0],
      ...controlPoints,
      controlPoints[n - 1],
      controlPoints[n - 1],
    ];

    for (let i = 1; i < pts.length - 2; i++) {
      const p_prev = pts[i - 1];
      const p_curr = pts[i];
      const p_next = pts[i + 1];
      const p_next2 = pts[i + 2];

      const b0 = {
        x: (p_prev.x + 4 * p_curr.x + p_next.x) / 6,
        y: (p_prev.y + 4 * p_curr.y + p_next.y) / 6,
      };
      const b1 = {
        x: (2 * p_curr.x + p_next.x) / 3,
        y: (2 * p_curr.y + p_next.y) / 3,
      };
      const b2 = {
        x: (p_curr.x + 2 * p_next.x) / 3,
        y: (p_curr.y + 2 * p_next.y) / 3,
      };
      const b3 = {
        x: (p_curr.x + 4 * p_next.x + p_next2.x) / 6,
        y: (p_curr.y + 4 * p_next.y + p_next2.y) / 6,
      };

      segments.push({ p0: b0, cp1: b1, cp2: b2, p1: b3 });
    }
  }

  return segments;
}

/**
 * Draws a B-spline curve onto an HTML5 Canvas 2D context
 */
export function drawBSpline(
  ctx: CanvasRenderingContext2D,
  controlPoints: Point[],
  closed = false
): void {
  const segments = bsplineToBeziers(controlPoints, closed);
  if (segments.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(segments[0].p0.x, segments[0].p0.y);

  for (const seg of segments) {
    ctx.bezierCurveTo(
      seg.cp1.x,
      seg.cp1.y,
      seg.cp2.x,
      seg.cp2.y,
      seg.p1.x,
      seg.p1.y
    );
  }

  if (closed) {
    ctx.closePath();
  }
}

/**
 * Converts a B-spline into an SVG path 'd' attribute
 */
export function bsplineToSVGPath(controlPoints: Point[], closed = false): string {
  const segments = bsplineToBeziers(controlPoints, closed);
  if (segments.length === 0) return '';

  let path = `M ${segments[0].p0.x.toFixed(2)} ${segments[0].p0.y.toFixed(2)}`;
  for (const seg of segments) {
    path += ` C ${seg.cp1.x.toFixed(2)} ${seg.cp1.y.toFixed(2)}, ${seg.cp2.x.toFixed(2)} ${seg.cp2.y.toFixed(2)}, ${seg.p1.x.toFixed(2)} ${seg.p1.y.toFixed(2)}`;
  }
  if (closed) {
    path += ' Z';
  }
  return path;
}

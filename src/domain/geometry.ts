import { Point, Rect, Terminal } from './types';

export const DEFAULT_GRID_SIZE = 20;

export function snapToGrid(val: number, gridSize: number = DEFAULT_GRID_SIZE): number {
  return Math.round(val / gridSize) * gridSize;
}

export function snapPointToGrid(p: Point, gridSize: number = DEFAULT_GRID_SIZE): Point {
  return {
    x: snapToGrid(p.x, gridSize),
    y: snapToGrid(p.y, gridSize),
  };
}

/**
 * Rotates a relative point (relX, relY) by 0, 90, 180, 270 degrees clockwise around (0,0)
 */
export function rotatePoint(relX: number, relY: number, rotation: 0 | 90 | 180 | 270): Point {
  switch (rotation) {
    case 90:
      return { x: -relY, y: relX };
    case 180:
      return { x: -relX, y: -relY };
    case 270:
      return { x: relY, y: -relX };
    case 0:
    default:
      return { x: relX, y: relY };
  }
}

/**
 * Computes absolute canvas coordinates for a terminal given component origin and rotation
 */
export function getAbsoluteTerminalPosition(
  compX: number,
  compY: number,
  rotation: 0 | 90 | 180 | 270,
  terminal: Terminal
): Point {
  const rot = rotatePoint(terminal.relX, terminal.relY, rotation);
  return {
    x: compX + rot.x,
    y: compY + rot.y,
  };
}

export function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function manhattanDistance(p1: Point, p2: Point): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function pointsEqual(p1: Point, p2: Point, tolerance: number = 0.01): boolean {
  return Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance;
}

/**
 * Checks if point p is on segment [p1, p2] within tolerance
 */
export function isPointOnSegment(p: Point, p1: Point, p2: Point, tolerance: number = 4): boolean {
  const minX = Math.min(p1.x, p2.x) - tolerance;
  const maxX = Math.max(p1.x, p2.x) + tolerance;
  const minY = Math.min(p1.y, p2.y) - tolerance;
  const maxY = Math.max(p1.y, p2.y) + tolerance;

  if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
    return false;
  }

  // Cross product distance
  const lineLength = distance(p1, p2);
  if (lineLength === 0) return distance(p, p1) <= tolerance;

  const dist = Math.abs((p2.y - p1.y) * p.x - (p2.x - p1.x) * p.y + p2.x * p1.y - p2.y * p1.x) / lineLength;
  return dist <= tolerance;
}

/**
 * Generates orthogonal route (polyline) between start and end point.
 * Prefers clean L or Z shaped orthogonal paths aligned with technical drafting rules.
 */
export function routeOrthogonalWire(
  start: Point,
  end: Point,
  preferredDirection: 'horizontal' | 'vertical' = 'vertical'
): Point[] {
  // If points are on the same line
  if (start.x === end.x || start.y === end.y) {
    return [{ ...start }, { ...end }];
  }

  // Orthogonal intermediate bend
  if (preferredDirection === 'vertical') {
    const midY = start.y + (end.y - start.y) / 2;
    // Standard Z shape with mid break
    return [
      { ...start },
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      { ...end },
    ];
  } else {
    const midX = start.x + (end.x - start.x) / 2;
    return [
      { ...start },
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      { ...end },
    ];
  }
}

/**
 * Simplifies a polyline by removing collinear intermediate points
 */
export function simplifyPolyline(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Collinear vertical?
    const isCollinearV = prev.x === curr.x && curr.x === next.x;
    // Collinear horizontal?
    const isCollinearH = prev.y === curr.y && curr.y === next.y;

    if (!isCollinearV && !isCollinearH) {
      result.push(curr);
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

export function getBoundingBox(points: Point[]): Rect {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

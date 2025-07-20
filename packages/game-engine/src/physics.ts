import type { Vector2D, WallSegment } from './types.js';

export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function clipSegmentToCircle(
  center: Vector2D,
  radius: number,
  a: Vector2D,
  b: Vector2D
): WallSegment | null {
  // If both endpoints are inside, return as-is
  const da = getDistance(center, a);
  const db = getDistance(center, b);
  if (da <= radius && db <= radius) return { start: a, end: b };

  // Solve line-circle intersection (parametric)
  const d = subtractVectors(b, a);
  const f = subtractVectors(a, center);
  const A = d.x * d.x + d.y * d.y;
  const B = 2 * (f.x * d.x + f.y * d.y);
  const C = f.x * f.x + f.y * f.y - radius * radius;
  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) return null; // no intersection

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-B - sqrtDisc) / (2 * A);
  const t2 = (-B + sqrtDisc) / (2 * A);

  const p1 = t1 >= 0 && t1 <= 1 ? { x: a.x + d.x * t1, y: a.y + d.y * t1 } : null;
  const p2 = t2 >= 0 && t2 <= 1 ? { x: a.x + d.x * t2, y: a.y + d.y * t2 } : null;

  // derive final segment endpoints inside the circle
  const insideA = da <= radius ? a : p1;
  const insideB = db <= radius ? b : p2;

  if (insideA && insideB) return { start: insideA, end: insideB };
  return null;
}

export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVector(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function normalizeVector(v: Vector2D): Vector2D {
  const magnitude = getMagnitude(v);
  if (magnitude === 0) return { x: 0, y: 0 };
  return scaleVector(v, 1 / magnitude);
}

export function getMagnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function getDistance(a: Vector2D, b: Vector2D): number {
  const diff = subtractVectors(b, a);
  return getMagnitude(diff);
}

export function clampVector(v: Vector2D, maxMagnitude: number): Vector2D {
  const magnitude = getMagnitude(v);
  if (magnitude <= maxMagnitude) return v;
  return scaleVector(normalizeVector(v), maxMagnitude);
}

export function applyFriction(velocity: Vector2D, friction: number): Vector2D {
  const magnitude = getMagnitude(velocity);
  if (magnitude < 0.01) return { x: 0, y: 0 };
  
  const frictionForce = Math.min(friction, magnitude);
  const newMagnitude = magnitude - frictionForce;
  
  return scaleVector(normalizeVector(velocity), newMagnitude);
}

export function keepInBounds(
  position: Vector2D,
  velocity: Vector2D,
  bounds: { width: number; height: number },
  radius = 0
): { position: Vector2D; velocity: Vector2D } {
  const newPos = { ...position };
  const newVel = { ...velocity };

  if (newPos.x - radius < 0) {
    newPos.x = radius;
    newVel.x = Math.abs(newVel.x) * 0.5;
  } else if (newPos.x + radius > bounds.width) {
    newPos.x = bounds.width - radius;
    newVel.x = -Math.abs(newVel.x) * 0.5;
  }

  if (newPos.y - radius < 0) {
    newPos.y = radius;
    newVel.y = Math.abs(newVel.y) * 0.5;
  } else if (newPos.y + radius > bounds.height) {
    newPos.y = bounds.height - radius;
    newVel.y = -Math.abs(newVel.y) * 0.5;
  }

  return { position: newPos, velocity: newVel };
}

export function distancePointToSegment(p: Vector2D, a: Vector2D, b: Vector2D): number {
  const ab = subtractVectors(b, a);
  const ap = subtractVectors(p, a);
  const abLen2 = ab.x * ab.x + ab.y * ab.y;
  const t = abLen2 === 0 ? 0 : Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / abLen2));
  const closest = { x: a.x + ab.x * t, y: a.y + ab.y * t };
  return getDistance(p, closest);
}

/**
 * Find intersection point between two line segments
 * Returns null if no intersection exists
 */
export function lineLineIntersection(
  p1: Vector2D, p2: Vector2D,  // First line segment
  p3: Vector2D, p4: Vector2D   // Second line segment
): Vector2D | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null; // Lines are parallel
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  // Check if intersection is within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  
  return null;
}
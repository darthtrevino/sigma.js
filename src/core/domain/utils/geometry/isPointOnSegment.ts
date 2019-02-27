import getDistance from "./getDistance";

export default function isPointOnSegment(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  epsilon: number
): boolean {
  // http://stackoverflow.com/a/328122
  const crossProduct = Math.abs((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1));
  const d = getDistance(x1, y1, x2, y2);
  const nCrossProduct = crossProduct / d; // normalized cross product

  return (
    nCrossProduct < epsilon &&
    Math.min(x1, x2) <= x &&
    x <= Math.max(x1, x2) &&
    Math.min(y1, y2) <= y &&
    y <= Math.max(y1, y2)
  );
}

import { Point } from "./interfaces";

export default function getPointOnBezierCurve(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): Point {
  // http://stackoverflow.com/a/15397596
  // Blending functions:
  const b0t = (1 - t) ** 3;
  const b1t = 3 * t * (1 - t) ** 2;
  const b2t = 3 * t ** 2 * (1 - t);
  const b3t = t ** 3;

  return {
    x: b0t * x1 + b1t * cx + b2t * dx + b3t * x2,
    y: b0t * y1 + b1t * cy + b2t * dy + b3t * y2
  };
}

import { Point } from "./interfaces";

export default function getPointsOnQuadraticCurve(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  xi: number,
  yi: number
): Point {
  // http://stackoverflow.com/a/5634528
  const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * xi + t ** 2 * x2;
  const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * yi + t ** 2 * y2;
  return { x, y };
}

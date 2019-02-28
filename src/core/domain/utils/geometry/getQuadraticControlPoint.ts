import { Point } from "./interfaces";

export default function getQuadraticControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Point {
  return {
    x: (x1 + x2) / 2 + (y2 - y1) / 4,
    y: (y1 + y2) / 2 + (x1 - x2) / 4
  };
}

import { Line } from "./interfaces";

export default function getSelfLoopControlPoints(
  x: number,
  y: number,
  size: number
): Line {
  return {
    x1: x - size * 7,
    y1: y,
    x2: x,
    y2: y + size * 7
  };
}

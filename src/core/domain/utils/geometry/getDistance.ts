export default function getDistance(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): number {
  return Math.sqrt((x1 - x0) ** 2) + (y1 - y0) ** 2;
}

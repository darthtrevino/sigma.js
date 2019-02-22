import { Point } from "./interfaces";

/**
 * Return the control point coordinates for a quadratic bezier curve.
 *
 * @param  {number} x1  The X coordinate of the start point.
 * @param  {number} y1  The Y coordinate of the start point.
 * @param  {number} x2  The X coordinate of the end point.
 * @param  {number} y2  The Y coordinate of the end point.
 * @return {x,y}        The control point coordinates.
 */
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

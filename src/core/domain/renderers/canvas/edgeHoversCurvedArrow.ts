import getSelfLoopControlPoints from "../../utils/geometry/getSelfLoopControlPoints";
import getQuadraticControlPoint from "../../utils/geometry/getQuadraticControlPoint";
import { Line, Point } from "../../utils/geometry/interfaces";
import { Edge, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

/**
 * This hover renderer will display the edge with a different color or size.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */

export default function edgeHoversCurvedArrow(
  edge: Edge,
  source: Node,
  target: Node,
  context: CanvasRenderingContext2D,
  settings: Settings
) {
  let { color } = edge;
  const prefix = settings("prefix") || "";
  const edgeColor = settings("edgeColor");
  const defaultNodeColor = settings("defaultNodeColor");
  const defaultEdgeColor = settings("defaultEdgeColor");
  let cp = {};
  const size = settings("edgeHoverSizeRatio") * (edge[`${prefix}size`] || 1);
  const tSize = target[`${prefix}size`];
  const sX = source[`${prefix}x`];
  const sY = source[`${prefix}y`];
  const tX = target[`${prefix}x`];
  const tY = target[`${prefix}y`];

  let d;
  let aSize;
  let aX;
  let aY;
  let vX;
  let vY;
  cp =
    source.id === target.id
      ? getSelfLoopControlPoints(sX, sY, tSize)
      : getQuadraticControlPoint(sX, sY, tX, tY);

  if (source.id === target.id) {
    const line = cp as Line;
    d = Math.sqrt((tX - line.x1) ** 2 + (tY - line.y1) ** 2);
    aSize = size * 2.5;
    aX = line.x1 + ((tX - line.x1) * (d - aSize - tSize)) / d;
    aY = line.y1 + ((tY - line.y1) * (d - aSize - tSize)) / d;
    vX = ((tX - line.x1) * aSize) / d;
    vY = ((tY - line.y1) * aSize) / d;
  } else {
    const point = cp as Point;
    d = Math.sqrt((tX - point.x) ** 2 + (tY - point.y) ** 2);
    aSize = size * 2.5;
    aX = point.x + ((tX - point.x) * (d - aSize - tSize)) / d;
    aY = point.y + ((tY - point.y) * (d - aSize - tSize)) / d;
    vX = ((tX - point.x) * aSize) / d;
    vY = ((tY - point.y) * aSize) / d;
  }

  if (!color)
    switch (edgeColor) {
      case "source":
        color = source.color || defaultNodeColor;
        break;
      case "target":
        color = target.color || defaultNodeColor;
        break;
      default:
        color = defaultEdgeColor;
        break;
    }

  if (settings("edgeHoverColor") === "edge") {
    color = edge.hover_color || color;
  } else {
    color = edge.hover_color || settings("defaultEdgeHoverColor") || color;
  }

  context.strokeStyle = color;
  context.lineWidth = size;
  context.beginPath();
  context.moveTo(sX, sY);
  if (source.id === target.id) {
    const line = cp as Line;
    context.bezierCurveTo(line.x2, line.y2, line.x1, line.y1, aX, aY);
  } else {
    const point = cp as Point;
    context.quadraticCurveTo(point.x, point.y, aX, aY);
  }
  context.stroke();

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(aX + vX, aY + vY);
  context.lineTo(aX + vY * 0.6, aY - vX * 0.6);
  context.lineTo(aX - vY * 0.6, aY + vX * 0.6);
  context.lineTo(aX + vX, aY + vY);
  context.closePath();
  context.fill();
}

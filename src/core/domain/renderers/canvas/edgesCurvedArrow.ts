import getSelfLoopControlPoints from "../../utils/geometry/getSelfLoopControlPoints";
import getQuadraticControlPoint from "../../utils/geometry/getQuadraticControlPoint";
import { Line, Point } from "../../utils/geometry/interfaces";

/**
 * This edge renderer will display edges as curves with arrow heading.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export default function edgesCurvedArrow(
  edge,
  source,
  target,
  context,
  settings
) {
  let { color } = edge;

  const prefix = settings("prefix") || "";
  const edgeColor = settings("edgeColor");
  const defaultNodeColor = settings("defaultNodeColor");
  const defaultEdgeColor = settings("defaultEdgeColor");
  let cp = {};

  const size = edge[`${prefix}size`] || 1;
  const tSize = target[`${prefix}size`];
  const sX = source[`${prefix}x`];
  const sY = source[`${prefix}y`];
  const tX = target[`${prefix}x`];
  const tY = target[`${prefix}y`];
  const aSize = Math.max(size * 2.5, settings("minArrowSize"));

  let d;
  let aX;
  let aY;
  let vX;
  let vY;
  cp =
    source.id === target.id
      ? getSelfLoopControlPoints(sX, sY, tSize)
      : getQuadraticControlPoint(sX, sY, tX, tY);

  if (source.id === target.id) {
    d = Math.sqrt((tX - (cp as Line).x1) ** 2 + (tY - (cp as Line).y1) ** 2);
    aX = (cp as Line).x1 + ((tX - (cp as Line).x1) * (d - aSize - tSize)) / d;
    aY = (cp as Line).y1 + ((tY - (cp as Line).y1) * (d - aSize - tSize)) / d;
    vX = ((tX - (cp as Line).x1) * aSize) / d;
    vY = ((tY - (cp as Line).y1) * aSize) / d;
  } else {
    d = Math.sqrt((tX - (cp as Point).x) ** 2 + (tY - (cp as Point).y) ** 2);
    aX = (cp as Point).x + ((tX - (cp as Point).x) * (d - aSize - tSize)) / d;
    aY = (cp as Point).y + ((tY - (cp as Point).y) * (d - aSize - tSize)) / d;
    vX = ((tX - (cp as Point).x) * aSize) / d;
    vY = ((tY - (cp as Point).y) * aSize) / d;
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

  context.strokeStyle = color;
  context.lineWidth = size;
  context.beginPath();
  context.moveTo(sX, sY);
  if (source.id === target.id) {
    context.bezierCurveTo(
      (cp as Line).x2,
      (cp as Line).y2,
      (cp as Line).x1,
      (cp as Line).y1,
      aX,
      aY
    );
  } else {
    context.quadraticCurveTo((cp as Point).x, (cp as Point).y, aX, aY);
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

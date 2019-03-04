import getSelfLoopControlPoints from "../../utils/geometry/getSelfLoopControlPoints";
import getQuadraticControlPoint from "../../utils/geometry/getQuadraticControlPoint";
import { Line, Point } from "../../utils/geometry/interfaces";
import { Edge, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

/**
 * This edge renderer will display edges as curves.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export default function edgesCurve(
  edge: Edge,
  source: Node,
  target: Node,
  context: CanvasRenderingContext2D,
  settings: Settings
) {
  let { color } = edge;

  const prefix = settings("prefix") || "";
  const size = (edge as any)[`${prefix}size`] || 1;
  const edgeColor = settings("edgeColor");
  const defaultNodeColor = settings("defaultNodeColor");
  const defaultEdgeColor = settings("defaultEdgeColor");
  const sSize = source[`${prefix}size`];
  const sX = source[`${prefix}x`];
  const sY = source[`${prefix}y`];
  const tX = target[`${prefix}x`];
  const tY = target[`${prefix}y`];

  const cp =
    source.id === target.id
      ? getSelfLoopControlPoints(sX, sY, sSize)
      : getQuadraticControlPoint(sX, sY, tX, tY);

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

  context.strokeStyle = color!;
  context.lineWidth = size;
  context.beginPath();
  context.moveTo(sX, sY);
  if (source.id === target.id) {
    context.bezierCurveTo(
      (cp as Line).x1,
      (cp as Line).y1,
      (cp as Line).x2,
      (cp as Line).y2,
      tX,
      tY
    );
  } else {
    context.quadraticCurveTo((cp as Point).x, (cp as Point).y, tX, tY);
  }
  context.stroke();
}

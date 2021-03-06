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
export default function edgeHoversDef(
  edge: Edge,
  source: Node,
  target: Node,
  context: CanvasRenderingContext2D,
  settings: Settings
) {
  let { color } = edge;
  const prefix = settings("prefix") || "";
  let size = edge[`${prefix}size`] || 1;
  const edgeColor = settings("edgeColor");
  const defaultNodeColor = settings("defaultNodeColor");
  const defaultEdgeColor = settings("defaultEdgeColor");

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
  size *= settings("edgeHoverSizeRatio");

  context.strokeStyle = color!;
  context.lineWidth = size;
  context.beginPath();
  context.moveTo(source[`${prefix}x`], source[`${prefix}y`]);
  context.lineTo(target[`${prefix}x`], target[`${prefix}y`]);
  context.stroke();
}

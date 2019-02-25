import { Edge, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

/**
 * The default edge renderer. It renders the edge as a simple line.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export default function edgesDef(
  edge: Edge,
  source: Node,
  target: Node,
  context: CanvasRenderingContext2D,
  settings: Settings
) {
  let { color } = edge;

  const prefix = settings("prefix") || "";
  const size = edge[`${prefix}size`] || 1;
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

  context.strokeStyle = color;
  context.lineWidth = size;
  context.beginPath();
  context.moveTo(source[`${prefix}x`], source[`${prefix}y`]);
  context.lineTo(target[`${prefix}x`], target[`${prefix}y`]);
  context.stroke();
}

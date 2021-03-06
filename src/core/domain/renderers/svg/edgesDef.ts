import { Edge, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

/**
 * The default edge renderer. It renders the node as a simple line.
 */
export default {
  /**
   * SVG Element creation.
   *
   * @param  {object}                   edge       The edge object.
   * @param  {object}                   source     The source node object.
   * @param  {object}                   target     The target node object.
   * @param  {configurable}             settings   The settings function.
   */
  create(edge: Edge, source: Node, target: Node, settings: Settings) {
    const edgeColor = settings("edgeColor");
    const defaultNodeColor = settings("defaultNodeColor");
    const defaultEdgeColor = settings("defaultEdgeColor");

    let { color } = edge;
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

    const line = document.createElementNS(settings("xmlns"), "line");

    // Attributes
    line.setAttributeNS(null, "data-edge-id", edge.id);
    line.setAttributeNS(null, "class", `${settings("classPrefix")}-edge`);
    line.setAttributeNS(null, "stroke", color!);

    return line;
  },

  /**
   * SVG Element update.
   *
   * @param  {object}                   edge       The edge object.
   * @param  {DOMElement}               line       The line DOM Element.
   * @param  {object}                   source     The source node object.
   * @param  {object}                   target     The target node object.
   * @param  {configurable}             settings   The settings function.
   */
  update(
    edge: Edge,
    line: HTMLElement,
    source: Node,
    target: Node,
    settings: Settings
  ) {
    const prefix = settings("prefix") || "";

    line.setAttributeNS(
      null,
      "stroke-width",
      (edge as any)[`${prefix}size`] || 1
    );
    line.setAttributeNS(null, "x1", source[`${prefix}x`]);
    line.setAttributeNS(null, "y1", source[`${prefix}y`]);
    line.setAttributeNS(null, "x2", target[`${prefix}x`]);
    line.setAttributeNS(null, "y2", target[`${prefix}y`]);

    line.style.display = "";
    return this;
  }
};

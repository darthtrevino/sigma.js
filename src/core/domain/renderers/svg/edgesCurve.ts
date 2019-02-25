import { Edge, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

/**
 * The curve edge renderer. It renders the node as a bezier curve.
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
    let { color } = edge;
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

    const path = document.createElementNS(settings("xmlns"), "path");

    // Attributes
    path.setAttributeNS(null, "data-edge-id", edge.id);
    path.setAttributeNS(null, "class", `${settings("classPrefix")}-edge`);
    path.setAttributeNS(null, "stroke", color);

    return path;
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
    path: HTMLElement,
    source: Node,
    target: Node,
    settings: Settings
  ) {
    const prefix = settings("prefix") || "";

    path.setAttributeNS(null, "stroke-width", edge[`${prefix}size`] || 1);

    // Control point
    const cx =
      (source[`${prefix}x`] + target[`${prefix}x`]) / 2 +
      (target[`${prefix}y`] - source[`${prefix}y`]) / 4;

    const cy =
      (source[`${prefix}y`] + target[`${prefix}y`]) / 2 +
      (source[`${prefix}x`] - target[`${prefix}x`]) / 4;

    // Path
    const p =
      `M${source[`${prefix}x`]},${source[`${prefix}y`]} ` +
      `Q${cx},${cy} ${target[`${prefix}x`]},${target[`${prefix}y`]}`;

    // Updating attributes
    path.setAttributeNS(null, "d", p);
    path.setAttributeNS(null, "fill", "none");

    // Showing
    path.style.display = "";

    return this;
  }
};

import { Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

/**
 * The default node renderer. It renders the node as a simple disc.
 */
export default {
  /**
   * SVG Element creation.
   *
   * @param  {object}                   node     The node object.
   * @param  {configurable}             settings The settings function.
   */
  create(node: Node, settings: Settings) {
    const circle = document.createElementNS(settings("xmlns"), "circle");

    // Defining the node's circle
    circle.setAttributeNS(null, "data-node-id", node.id);
    circle.setAttributeNS(null, "class", `${settings("classPrefix")}-node`);
    circle.setAttributeNS(
      null,
      "fill",
      node.color || settings("defaultNodeColor")
    );

    // Returning the DOM Element
    return circle;
  },

  /**
   * SVG Element update.
   *
   * @param  {object}                   node     The node object.
   * @param  {DOMElement}               circle   The node DOM element.
   * @param  {configurable}             settings The settings function.
   */
  update(node: Node, circle: HTMLElement, settings: Settings) {
    const prefix = settings("prefix") || "";

    // Applying changes
    // TODO: optimize - check if necessary
    circle.setAttributeNS(null, "cx", node[`${prefix}x`]);
    circle.setAttributeNS(null, "cy", node[`${prefix}y`]);
    circle.setAttributeNS(null, "r", node[`${prefix}size`]);

    // Updating only if not freestyle
    if (!settings("freeStyle"))
      circle.setAttributeNS(
        null,
        "fill",
        node.color || settings("defaultNodeColor")
      );

    // Showing
    circle.style.display = "";

    return this;
  }
};

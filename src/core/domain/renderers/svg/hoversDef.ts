import { Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

/**
 * The default hover renderer.
 */
export default {
  /**
   * SVG Element creation.
   *
   * @param  {object}           node               The node object.
   * @param  {CanvasElement}    measurementCanvas  A fake canvas handled by
   *                            the svg to perform some measurements and
   *                            passed by the renderer.
   * @param  {DOMElement}       nodeCircle         The node DOM Element.
   * @param  {configurable}     settings           The settings function.
   */
  create(
    node: Node,
    nodeCircle: HTMLElement,
    measurementCanvas: CanvasRenderingContext2D,
    settings: Settings
  ) {
    // Defining visual properties
    let w;
    let h;
    let e;
    const prefix = settings("prefix") || "";
    let nodeX: number = node[`${prefix}x`];
    let nodeY: number = node[`${prefix}y`];
    const size: number = node[`${prefix}size`];
    const fontSize =
      settings("labelSize") === "fixed"
        ? settings("defaultLabelSize")
        : settings("labelSizeRatio") * size;

    const fontColor =
      settings("labelHoverColor") === "node"
        ? node.color || settings("defaultNodeColor")
        : settings("defaultLabelHoverColor");

    // Creating elements
    const group = document.createElementNS(settings("xmlns"), "g");
    const rectangle = document.createElementNS(settings("xmlns"), "rect");
    const circle = document.createElementNS(settings("xmlns"), "circle");
    const text = document.createElementNS(settings("xmlns"), "text");

    // Defining properties
    group.setAttributeNS(null, "class", `${settings("classPrefix")}-hover`);
    group.setAttributeNS(null, "data-node-id", node.id);

    if (typeof node.label === "string") {
      // Text
      text.innerHTML = node.label;
      text.textContent = node.label;
      text.setAttributeNS(
        null,
        "class",
        `${settings("classPrefix")}-hover-label`
      );
      text.setAttributeNS(null, "font-size", fontSize);
      text.setAttributeNS(null, "font-family", settings("font"));
      text.setAttributeNS(null, "fill", fontColor);
      text.setAttributeNS(null, "x", `${Math.round(nodeX + size + 3)}`);
      text.setAttributeNS(null, "y", `${Math.round(nodeY + fontSize / 3)}`);

      // Measures
      // OPTIMIZE: Find a better way than a measurement canvas
      w = Math.round(
        measurementCanvas.measureText(node.label).width +
          fontSize / 2 +
          size +
          9
      );
      h = Math.round(fontSize + 4);
      e = Math.round(fontSize / 2 + 2);

      // Circle
      circle.setAttributeNS(
        null,
        "class",
        `${settings("classPrefix")}-hover-area`
      );
      circle.setAttributeNS(null, "fill", "#fff");
      circle.setAttributeNS(null, "cx", `${nodeX}`);
      circle.setAttributeNS(null, "cy", `${nodeY}`);
      circle.setAttributeNS(null, "r", `${e}`);

      // Rectangle
      rectangle.setAttributeNS(
        null,
        "class",
        `${settings("classPrefix")}-hover-area`
      );
      rectangle.setAttributeNS(null, "fill", "#fff");
      rectangle.setAttributeNS(null, "x", `${nodeX + e / 4}`);
      rectangle.setAttributeNS(null, "y", `${nodeY - e}`);
      rectangle.setAttributeNS(null, "width", `${w}`);
      rectangle.setAttributeNS(null, "height", `${h}`);
    }

    // Appending childs
    group.appendChild(circle);
    group.appendChild(rectangle);
    group.appendChild(text);
    group.appendChild(nodeCircle);

    return group;
  }
};

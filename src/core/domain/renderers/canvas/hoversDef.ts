import { SigmaLibrary, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

export default (sigma: SigmaLibrary) =>
  function hoversDef(
    node: Node,
    context: CanvasRenderingContext2D,
    settings: Settings
  ) {
    let x;
    let y;
    let w;
    let h;
    let e;
    const fontStyle = settings("hoverFontStyle") || settings("fontStyle");
    const prefix = settings("prefix") || "";
    const size = node[`${prefix}size`];
    const fontSize =
      settings("labelSize") === "fixed"
        ? settings("defaultLabelSize")
        : settings("labelSizeRatio") * size;

    // Label background:
    context.font = `${(fontStyle ? `${fontStyle} ` : "") +
      fontSize}px ${settings("hoverFont") || settings("font")}`;

    context.beginPath();
    context.fillStyle =
      settings("labelHoverBGColor") === "node"
        ? node.color || settings("defaultNodeColor")
        : settings("defaultHoverLabelBGColor");

    if (node.label && settings("labelHoverShadow")) {
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 8;
      context.shadowColor = settings("labelHoverShadowColor");
    }

    if (node.label && typeof node.label === "string") {
      x = Math.round(node[`${prefix}x`] - fontSize / 2 - 2);
      y = Math.round(node[`${prefix}y`] - fontSize / 2 - 2);
      w = Math.round(
        context.measureText(node.label).width + fontSize / 2 + size + 7
      );
      h = Math.round(fontSize + 4);
      e = Math.round(fontSize / 2 + 2);

      context.moveTo(x, y + e);
      context.arcTo(x, y, x + e, y, e);
      context.lineTo(x + w, y);
      context.lineTo(x + w, y + h);
      context.lineTo(x + e, y + h);
      context.arcTo(x, y + h, x, y + h - e, e);
      context.lineTo(x, y + e);

      context.closePath();
      context.fill();

      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 0;
    }

    // Node border:
    if (settings("borderSize") > 0) {
      context.beginPath();
      context.fillStyle =
        settings("nodeBorderColor") === "node"
          ? node.color || settings("defaultNodeColor")
          : settings("defaultNodeBorderColor");
      context.arc(
        node[`${prefix}x`],
        node[`${prefix}y`],
        size + settings("borderSize"),
        0,
        Math.PI * 2,
        true
      );
      context.closePath();
      context.fill();
    }

    // Node:
    const nodeRenderer =
      sigma.canvas.nodes[node.type] || sigma.canvas.nodes.def;
    nodeRenderer(node, context, settings);

    // Display the label:
    if (node.label && typeof node.label === "string") {
      context.fillStyle =
        settings("labelHoverColor") === "node"
          ? node.color || settings("defaultNodeColor")
          : settings("defaultLabelHoverColor");

      context.fillText(
        node.label,
        Math.round(node[`${prefix}x`] + size + 3),
        Math.round(node[`${prefix}y`] + fontSize / 3)
      );
    }
  };

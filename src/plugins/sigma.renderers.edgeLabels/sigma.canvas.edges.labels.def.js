export default function extend(sigma) {
  if (typeof sigma === "undefined") throw new Error("sigma is not declared");

  // Initialize packages:
  sigma.utils.pkg("sigma.canvas.edges.labels");

  /**
   * This label renderer will just display the label on the line of the edge.
   * The label is rendered at half distance of the edge extremities, and is
   * always oriented from left to right on the top side of the line.
   *
   * @param  {object}                   edge         The edge object.
   * @param  {object}                   source node  The edge source node.
   * @param  {object}                   target node  The edge target node.
   * @param  {CanvasRenderingContext2D} context      The canvas context.
   * @param  {configurable}             settings     The settings function.
   */
  sigma.canvas.edges.labels.def = function(
    edge,
    source,
    target,
    context,
    settings
  ) {
    if (typeof edge.label !== "string" || source == target) return;

    const prefix = settings("prefix") || "";

    const size = edge[`${prefix}size`] || 1;

    if (size < settings("edgeLabelThreshold")) return;

    if (settings("edgeLabelSizePowRatio") === 0)
      throw new Error('"edgeLabelSizePowRatio" must not be 0.');

    let fontSize;

    const x = (source[`${prefix}x`] + target[`${prefix}x`]) / 2;

    const y = (source[`${prefix}y`] + target[`${prefix}y`]) / 2;

    const dX = target[`${prefix}x`] - source[`${prefix}x`];

    const dY = target[`${prefix}y`] - source[`${prefix}y`];

    const sign = source[`${prefix}x`] < target[`${prefix}x`] ? 1 : -1;

    const angle = Math.atan2(dY * sign, dX * sign);

    // The font size is sublineraly proportional to the edge size, in order to
    // avoid very large labels on screen.
    // This is achieved by f(x) = x * x^(-1/ a), where 'x' is the size and 'a'
    // is the edgeLabelSizePowRatio. Notice that f(1) = 1.
    // The final form is:
    // f'(x) = b * x * x^(-1 / a), thus f'(1) = b. Application:
    // fontSize = defaultEdgeLabelSize if edgeLabelSizePowRatio = 1
    fontSize =
      settings("edgeLabelSize") === "fixed"
        ? settings("defaultEdgeLabelSize")
        : settings("defaultEdgeLabelSize") *
          size *
          Math.pow(size, -1 / settings("edgeLabelSizePowRatio"));

    context.save();

    if (edge.active) {
      context.font = [
        settings("activeFontStyle"),
        `${fontSize}px`,
        settings("activeFont") || settings("font")
      ].join(" ");

      context.fillStyle =
        settings("edgeActiveColor") === "edge"
          ? edge.active_color || settings("defaultEdgeActiveColor")
          : settings("defaultEdgeLabelActiveColor");
    } else {
      context.font = [
        settings("fontStyle"),
        `${fontSize}px`,
        settings("font")
      ].join(" ");

      context.fillStyle =
        settings("edgeLabelColor") === "edge"
          ? edge.color || settings("defaultEdgeColor")
          : settings("defaultEdgeLabelColor");
    }

    context.textAlign = "center";
    context.textBaseline = "alphabetic";

    context.translate(x, y);
    context.rotate(angle);
    context.fillText(edge.label, 0, -size / 2 - 3);

    context.restore();
  };
}

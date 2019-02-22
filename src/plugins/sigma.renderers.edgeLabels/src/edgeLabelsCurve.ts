/**
 * This label renderer will just display the label on the curve of the edge.
 * The label is rendered at half distance of the edge extremities, and is
 * always oriented from left to right on the top side of the curve.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export default sigma =>
  function edgeLabelsCurve(edge, source, target, context, settings) {
    if (typeof edge.label !== "string") return;

    const prefix = settings("prefix") || "";

    const size = edge[`${prefix}size`] || 1;

    if (size < settings("edgeLabelThreshold")) return;

    const sSize = source[`${prefix}size`];
    const sX = source[`${prefix}x`];
    const sY = source[`${prefix}y`];
    const tX = target[`${prefix}x`];
    const tY = target[`${prefix}y`];
    const count = edge.count || 0;
    const dX = tX - sX;
    const dY = tY - sY;
    const sign = sX < tX ? 1 : -1;
    let cp: any = {};
    let c;
    let angle;
    const t = 0.5; // length of the curve

    if (source.id === target.id) {
      cp = sigma.utils.getSelfLoopControlPoints(sX, sY, sSize, count);
      c = sigma.utils.geom.getPointOnBezierCurve(
        t,
        sX,
        sY,
        tX,
        tY,
        cp.x1,
        cp.y1,
        cp.x2,
        cp.y2
      );
      angle = Math.atan2(1, 1); // 45°
    } else {
      cp = sigma.utils.geom.getQuadraticControlPoint(sX, sY, tX, tY, count);
      c = sigma.utils.geom.getPointOnQuadraticCurve(
        t,
        sX,
        sY,
        tX,
        tY,
        cp.x,
        cp.y
      );
      angle = Math.atan2(dY * sign, dX * sign);
    }

    // The font size is sublineraly proportional to the edge size, in order to
    // avoid very large labels on screen.
    // This is achieved by f(x) = x * x^(-1/ a), where 'x' is the size and 'a'
    // is the edgeLabelSizePowRatio. Notice that f(1) = 1.
    // The final form is:
    // f'(x) = b * x * x^(-1 / a), thus f'(1) = b. Application:
    // fontSize = defaultEdgeLabelSize if edgeLabelSizePowRatio = 1
    const fontSize =
      settings("edgeLabelSize") === "fixed"
        ? settings("defaultEdgeLabelSize")
        : settings("defaultEdgeLabelSize") *
          size *
          size ** (-1 / settings("edgeLabelSizePowRatio"));

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

    context.translate(c.x, c.y);
    context.rotate(angle);
    context.fillText(edge.label, 0, -size / 2 - 3);

    context.restore();
  };

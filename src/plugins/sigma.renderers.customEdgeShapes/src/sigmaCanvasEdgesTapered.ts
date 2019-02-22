/**
 * This method renders the edge as a tapered line.
 * Danny Holten, Petra Isenberg, Jean-Daniel Fekete, and J. Van Wijk (2010)
 * Performance Evaluation of Tapered, Curved, and Animated Directed-Edge
 * Representations in Node-Link Graphs. Research Report, Sep 2010.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export default sigma =>
  function canvasEdgesTapered(edge, source, target, context, settings) {
    // The goal is to draw a triangle where the target node is a point of
    // the triangle, and the two other points are the intersection of the
    // source circle and the circle (target, distance(source, target)).
    let color = edge.active
      ? edge.active_color || settings("defaultEdgeActiveColor")
      : edge.color;

    let prefix = settings("prefix") || "";
    const size = edge[`${prefix}size`] || 1;
    const edgeColor = settings("edgeColor");
    prefix = settings("prefix") || "";
    const defaultNodeColor = settings("defaultNodeColor");
    const defaultEdgeColor = settings("defaultEdgeColor");
    const sX = source[`${prefix}x`];
    const sY = source[`${prefix}y`];
    const tX = target[`${prefix}x`];
    const tY = target[`${prefix}y`];
    const dist = sigma.utils.geom.getDistance(sX, sY, tX, tY);

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

    // Intersection points:
    const c = sigma.utils.geom.getCircleIntersection(
      sX,
      sY,
      size,
      tX,
      tY,
      dist
    );

    context.save();

    if (edge.active) {
      context.fillStyle =
        settings("edgeActiveColor") === "edge"
          ? color || defaultEdgeColor
          : settings("defaultEdgeActiveColor");
    } else {
      context.fillStyle = color;
    }

    // Turn transparency on:
    context.globalAlpha = 0.65;

    // Draw the triangle:
    context.beginPath();
    context.moveTo(tX, tY);
    context.lineTo(c.xi, c.yi);
    context.lineTo(c.xi_prime, c.yi_prime);
    context.closePath();
    context.fill();

    context.restore();
  };

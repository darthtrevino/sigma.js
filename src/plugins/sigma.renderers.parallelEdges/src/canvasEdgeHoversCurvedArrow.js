export default sigma => {
  /**
   * This hover renderer will display the edge with a different color or size.
   *
   * @param  {object}                   edge         The edge object.
   * @param  {object}                   source node  The edge source node.
   * @param  {object}                   target node  The edge target node.
   * @param  {CanvasRenderingContext2D} context      The canvas context.
   * @param  {configurable}             settings     The settings function.
   */
  return function curvedArrow(edge, source, target, context, settings) {
    let { color } = edge;
    const prefix = settings("prefix") || "";
    const edgeColor = settings("edgeColor");
    const defaultNodeColor = settings("defaultNodeColor");
    const defaultEdgeColor = settings("defaultEdgeColor");

    let cp = {};
    const size = settings("edgeHoverSizeRatio") * (edge[`${prefix}size`] || 1);
    const count = edge.count || 0;
    const tSize = target[`${prefix}size`];
    const sX = source[`${prefix}x`];
    const sY = source[`${prefix}y`];
    const tX = target[`${prefix}x`];
    const tY = target[`${prefix}y`];

    let d;
    let aSize;
    let aX;
    let aY;
    let vX;
    let vY;

    cp =
      source.id === target.id
        ? sigma.utils.getSelfLoopControlPoints(sX, sY, tSize, count)
        : sigma.utils.geom.getQuadraticControlPoint(sX, sY, tX, tY, count);

    if (source.id === target.id) {
      d = Math.sqrt((tX - cp.x1) ** 2 + (tY - cp.y1) ** 2);
      aSize = size * 2.5;
      aX = cp.x1 + ((tX - cp.x1) * (d - aSize - tSize)) / d;
      aY = cp.y1 + ((tY - cp.y1) * (d - aSize - tSize)) / d;
      vX = ((tX - cp.x1) * aSize) / d;
      vY = ((tY - cp.y1) * aSize) / d;
    } else {
      d = Math.sqrt((tX - cp.x) ** 2 + (tY - cp.y) ** 2);
      aSize = size * 2.5;
      aX = cp.x + ((tX - cp.x) * (d - aSize - tSize)) / d;
      aY = cp.y + ((tY - cp.y) * (d - aSize - tSize)) / d;
      vX = ((tX - cp.x) * aSize) / d;
      vY = ((tY - cp.y) * aSize) / d;
    }

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

    context.strokeStyle = color;
    context.lineWidth = size;
    context.beginPath();
    context.moveTo(sX, sY);
    if (source.id === target.id) {
      context.bezierCurveTo(cp.x2, cp.y2, cp.x1, cp.y1, aX, aY);
    } else {
      context.quadraticCurveTo(cp.x, cp.y, aX, aY);
    }
    context.stroke();

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(aX + vX, aY + vY);
    context.lineTo(aX + vY * 0.6, aY - vX * 0.6);
    context.lineTo(aX - vY * 0.6, aY + vX * 0.6);
    context.lineTo(aX + vX, aY + vY);
    context.closePath();
    context.fill();
  };
};
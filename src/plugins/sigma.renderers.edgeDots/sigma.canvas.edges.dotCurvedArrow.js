export default function extend(sigma) {
  sigma.utils.pkg("sigma.canvas.edges");

  /**
   * This edge renderer will display edges as curves with arrow heading.
   *
   * @param  {object}                   edge         The edge object.
   * @param  {object}                   source node  The edge source node.
   * @param  {object}                   target node  The edge target node.
   * @param  {CanvasRenderingContext2D} context      The canvas context.
   * @param  {configurable}             settings     The settings function.
   */
  sigma.canvas.edges.dotCurvedArrow = function(
    edge,
    source,
    target,
    context,
    settings
  ) {
    let color = edge.color;

    const prefix = settings("prefix") || "";

    const edgeColor = settings("edgeColor");

    const defaultNodeColor = settings("defaultNodeColor");

    const defaultEdgeColor = settings("defaultEdgeColor");

    let cp = {};

    const size = edge[`${prefix}size`] || 1;

    const count = edge.count || 0;

    const tSize = target[`${prefix}size`];

    const sX = source[`${prefix}x`];

    const sY = source[`${prefix}y`];

    const tX = target[`${prefix}x`];

    const tY = target[`${prefix}y`];

    const aSize = Math.max(size * 2.5, settings("minArrowSize"));

    let d;

    let aX;

    let aY;

    let vX;

    let vY;

    cp =
      source.id === target.id
        ? sigma.utils.getSelfLoopControlPoints(sX, sY, tSize, count)
        : sigma.utils.geom.getQuadraticControlPoint(sX, sY, tX, tY, count);

    if (source.id === target.id) {
      d = Math.sqrt(Math.pow(tX - cp.x1, 2) + Math.pow(tY - cp.y1, 2));
      aX = cp.x1 + ((tX - cp.x1) * (d - aSize - tSize)) / d;
      aY = cp.y1 + ((tY - cp.y1) * (d - aSize - tSize)) / d;
      vX = ((tX - cp.x1) * aSize) / d;
      vY = ((tY - cp.y1) * aSize) / d;
    } else {
      d = Math.sqrt(Math.pow(tX - cp.x, 2) + Math.pow(tY - cp.y, 2));
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
    if (edge.sourceDotColor != undefined || edge.targetDotColor != undefined) {
      let dotOffset = edge.dotOffset || 3;
      let dotSize = edge.dotSize || 1;
      dotSize = size * dotSize;
      dotOffset *= tSize;
      if (edge.sourceDotColor != undefined) {
        createDot(
          context,
          sX,
          sY,
          cp,
          tX,
          tY,
          dotOffset,
          dotSize,
          edge.sourceDotColor
        );
      }
      if (edge.targetDotColor != undefined) {
        createDot(
          context,
          tX,
          tY,
          cp,
          sX,
          sY,
          dotOffset,
          dotSize,
          edge.targetDotColor
        );
      }
    }
  };

  function createDot(context, sX, sY, cp, tX, tY, offset, size, color) {
    context.beginPath();
    context.fillStyle = color;
    const dot = getPointOnBezier(sX, sY, cp.x, cp.y, tX, tY, offset);
    context.arc(dot.x, dot.y, size * 3, 0, 2 * Math.PI, false);
    context.fill();
  }

  function getQBezierValue(t, p1, p2, p3) {
    const iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
  }

  function getQuadraticCurvePoint(
    startX,
    startY,
    cpX,
    cpY,
    endX,
    endY,
    position
  ) {
    return {
      x: getQBezierValue(position, startX, cpX, endX),
      y: getQBezierValue(position, startY, cpY, endY)
    };
  }
  function getDistanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }
  /* Function to get a point on a bezier curve a certain distance away from
   its source. Needed since the position on a beziercurve is given to the
   formula as a percentage (t). */
  function getPointOnBezier(startX, startY, cpX, cpY, endX, endY, distance) {
    let bestT = 0;
    let bestAccuracy = 1000;
    const stepSize = 0.001;
    for (let t = 0; t < 1; t += stepSize) {
      const currentPoint = getQuadraticCurvePoint(
        startX,
        startY,
        cpX,
        cpY,
        endX,
        endY,
        t
      );
      const currentDistance = getDistanceBetweenPoints(
        startX,
        startY,
        currentPoint.x,
        currentPoint.y
      );
      if (Math.abs(currentDistance - distance) < bestAccuracy) {
        bestAccuracy = Math.abs(currentDistance - distance);
        bestT = t;
      }
    }
    return getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, bestT);
  }
}

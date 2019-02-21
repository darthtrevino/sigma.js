export function getQBezierValue(t, p1, p2, p3) {
  const iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}

export function getDistanceBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

export function getQuadraticCurvePoint(
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

/* Function to get a point on a bezier curve a certain distance away from
       its source. Needed since the position on a beziercurve is given to the
       formula as a percentage (t). */
export function getPointOnBezier(
  startX,
  startY,
  cpX,
  cpY,
  endX,
  endY,
  distance
) {
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

export function createDot(context, sX, sY, cp, tX, tY, offset, size, color) {
  context.beginPath();
  context.fillStyle = color;
  const dot = getPointOnBezier(sX, sY, cp.x, cp.y, tX, tY, offset);
  context.arc(dot.x, dot.y, size * 3, 0, 2 * Math.PI, false);
  context.fill();
}

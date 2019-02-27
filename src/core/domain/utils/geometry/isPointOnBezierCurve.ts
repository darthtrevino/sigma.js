import getDistance from "./getDistance";
import getPointOnBezierCurve from "./getPointOnBezierCurve";

export default function isPointOnBezierCurve(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cpx1: number,
  cpy1: number,
  cpx2: number,
  cpy2: number,
  epsilon: number
): boolean {
  // Fails if the point is too far from the extremities of the segment,
  // preventing for more costly computation:
  const dP1CP1 = getDistance(x1, y1, cpx1, cpy1);
  if (Math.abs(x - x1) > dP1CP1 || Math.abs(y - y1) > dP1CP1) {
    return false;
  }

  const dP1 = getDistance(x, y, x1, y1);
  const dP2 = getDistance(x, y, x2, y2);
  let t = 0.5;
  let r = dP1 < dP2 ? -0.01 : 0.01;
  const rThreshold = 0.001;
  let i = 100;
  let pt = getPointOnBezierCurve(t, x1, y1, x2, y2, cpx1, cpy1, cpx2, cpy2);
  let dt = getDistance(x, y, pt.x, pt.y);
  let oldDt;

  // This algorithm minimizes the distance from the point to the curve. It
  // find the optimal t value where t=0 is the start point and t=1 is the end
  // point of the curve, starting from t=0.5.
  // It terminates because it runs a maximum of i interations.
  while (
    i-- > 0 &&
    t >= 0 &&
    t <= 1 &&
    dt > epsilon &&
    (r > rThreshold || r < -rThreshold)
  ) {
    oldDt = dt;
    pt = getPointOnBezierCurve(t, x1, y1, x2, y2, cpx1, cpy1, cpx2, cpy2);
    dt = getDistance(x, y, pt.x, pt.y);

    if (dt > oldDt) {
      // not the right direction:
      // halfstep in the opposite direction
      r = -r / 2;
      t += r;
    } else if (t + r < 0 || t + r > 1) {
      // oops, we've gone too far:
      // revert with a halfstep
      r /= 2;
      dt = oldDt;
    } else {
      // progress:
      t += r;
    }
  }

  return dt < epsilon;
}

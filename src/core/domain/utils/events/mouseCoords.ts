import getX from "./getX";
import getY from "./getY";
import getCenter from "./getCenter";

export default function mouseCoords(
  e: MouseEvent | TouchEvent,
  x?: number,
  y?: number
) {
  x = x || getX(e);
  y = y || getY(e);
  return {
    x: x - getCenter(e).x,
    y: y - getCenter(e).y,
    clientX: (e as any).clientX,
    clientY: (e as any).clientY,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    altKey: e.altKey,
    shiftKey: e.shiftKey
  };
}

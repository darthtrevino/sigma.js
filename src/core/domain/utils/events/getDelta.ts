/**
 * Extract the wheel delta from a mouse or touch event.
 *
 * @param  {event}  e A mouse or touch event.
 * @return {number}   The wheel delta of the mouse.
 */
export default function getDelta(e: MouseEvent | TouchEvent) {
  return (
    ((e as any).wheelDelta !== undefined && (e as any).wheelDelta) ||
    (e.detail !== undefined && -e.detail)
  );
}

/**
 * Extract the width from a mouse or touch event.
 *
 * @param  {event}  e A mouse or touch event.
 * @return {number}   The width of the event's target.
 */
export default function getWidth(e: MouseEvent | TouchEvent) {
  const tgt = e.target as any;
  const w = !tgt.ownerSVGElement ? tgt.width : tgt.ownerSVGElement.width;
  return (
    (typeof w === "number" && w) ||
    (w !== undefined && w.baseVal !== undefined && w.baseVal.value)
  );
}

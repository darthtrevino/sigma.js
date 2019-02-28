export default function getWidth(e: MouseEvent | TouchEvent) {
  const tgt = e.target as any;
  const w = !tgt.ownerSVGElement ? tgt.width : tgt.ownerSVGElement.width;
  return (
    (typeof w === "number" && w) ||
    (w !== undefined && w.baseVal !== undefined && w.baseVal.value)
  );
}

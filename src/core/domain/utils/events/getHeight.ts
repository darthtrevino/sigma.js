export default function getHeight(e: MouseEvent | TouchEvent) {
  const tgt = (e as any).target;
  const h = !tgt.ownerSVGElement ? tgt.height : tgt.ownerSVGElement.height;

  return (
    (typeof h === "number" && h) ||
    (h !== undefined && h.baseVal !== undefined && h.baseVal.value)
  );
}

export default function getX(event: MouseEvent | TouchEvent): number {
  const e = event as any;
  return (
    (e.offsetX !== undefined && e.offsetX) ||
    (e.layerX !== undefined && e.layerX) ||
    (e.clientX !== undefined && e.clientX)
  );
}

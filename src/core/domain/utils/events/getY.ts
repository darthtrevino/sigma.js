export default function getY(event: MouseEvent | TouchEvent): number {
  const e = event as any;
  return (
    (e.offsetY !== undefined && e.offsetY) ||
    (e.layerY !== undefined && e.layerY) ||
    (e.clientY !== undefined && e.clientY)
  );
}

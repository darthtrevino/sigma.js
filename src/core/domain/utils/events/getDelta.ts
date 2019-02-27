export default function getDelta(e: MouseEvent | TouchEvent) {
  return (
    ((e as any).wheelDelta !== undefined && (e as any).wheelDelta) ||
    (e.detail !== undefined && -e.detail)
  );
}

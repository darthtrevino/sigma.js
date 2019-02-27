export default function rotation(angle: number, m2?: boolean) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return m2 ? [cos, -sin, sin, cos] : [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
}

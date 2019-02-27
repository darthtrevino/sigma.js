export default function scale(ratio: number, m2?: boolean) {
  return m2 ? [ratio, 0, 0, ratio] : [ratio, 0, 0, 0, ratio, 0, 0, 0, 1];
}

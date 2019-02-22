export function linearNone(k: number) {
  return k;
}

export function quadraticIn(k: number) {
  return k ** 2;
}

export function quadraticOut(k: number) {
  return k * (2 - k);
}

export function quadraticInOut(k: number) {
  if ((k *= 2) < 1) {
    return 0.5 * k * k;
  }
  return -0.5 * (--k * (k - 2) - 1);
}

export function cubicIn(k: number) {
  return k * k * k;
}

export function cubicOut(k: number) {
  return --k * k * k + 1;
}

export function cubicInOut(k: number) {
  if ((k *= 2) < 1) return 0.5 * k * k * k;
  return 0.5 * ((k -= 2) * k * k + 2);
}

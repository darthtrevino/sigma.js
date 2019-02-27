export default function dateNow(): number {
  return Date.now ? Date.now() : new Date().getTime();
}

/**
 * A short "Date.now()" polyfill.
 *
 * @return {Number} The current time (in ms).
 */
export default function dateNow(): number {
  return Date.now ? Date.now() : new Date().getTime();
}

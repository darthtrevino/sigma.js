/**
 * Returns a unique incremental number ID.
 *
 * Example:
 * ********
 *  > id();
 *  > // 1;
 *  >
 *  > id();
 *  > // 2;
 *  >
 *  > id();
 *  > // 3;
 *
 * @param  {string} pkgName The name of the package to create/find.
 * @return {object}         The related package.
 */
let id = 0;
export default function nextId() {
  return ++id;
}

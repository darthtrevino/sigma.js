/**
 * This custom tool function removes every pair key/value from an hash. The
 * goal is to avoid creating a new object while some other references are
 * still hanging in some scopes...
 *
 * @param  {object} obj The object to empty.
 * @return {object}     The empty object.
 */
export default function emptyObject(obj: { [key: string]: any }) {
  Object.keys(obj).forEach(k => {
    // eslint-disable-next-line no-prototype-builtins
    if (!("hasOwnProperty" in obj) || obj.hasOwnProperty(k)) {
      delete obj[k];
    }
  });
}

export default function emptyObject(obj: { [key: string]: any }) {
  Object.keys(obj).forEach(k => {
    // eslint-disable-next-line no-prototype-builtins
    if (!("hasOwnProperty" in obj) || obj.hasOwnProperty(k)) {
      delete obj[k];
    }
  });
}

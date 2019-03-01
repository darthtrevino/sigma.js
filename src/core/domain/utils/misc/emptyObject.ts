import { Keyed } from "../../../interfaces";

export default function emptyObject(obj: Keyed<any>) {
  Object.keys(obj).forEach(k => {
    // eslint-disable-next-line no-prototype-builtins
    if (!("hasOwnProperty" in obj) || obj.hasOwnProperty(k)) {
      delete obj[k];
    }
  });
}

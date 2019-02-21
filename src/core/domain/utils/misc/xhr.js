// XHR polyfill:
export default function xhr(global = window) {
  if (global.XMLHttpRequest) {
    return new XMLHttpRequest();
  }
  if (global.ActiveXObject) {
    const names = [
      "Msxml2.XMLHTTP.6.0",
      "Msxml2.XMLHTTP.3.0",
      "Msxml2.XMLHTTP",
      "Microsoft.XMLHTTP"
    ];

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      /* globals ActiveXObject: true */
      try {
        return new ActiveXObject(name);
      } catch (e) {
        // swallow
      }
    }
  }

  return null;
}

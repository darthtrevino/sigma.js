export default function extend(sigma) {
  // Initialize package:
  sigma.utils.pkg("sigma.parsers");
  sigma.utils.pkg("sigma.utils");

  /**
   * Just an XmlHttpRequest polyfill for different IE versions.
   *
   * @return {*} The XHR like object.
   */
  sigma.utils.xhr = function xhr() {
    if (window.XMLHttpRequest) return new XMLHttpRequest();

    if (window.ActiveXObject) {
      const names = [
        "Msxml2.XMLHTTP.6.0",
        "Msxml2.XMLHTTP.3.0",
        "Msxml2.XMLHTTP",
        "Microsoft.XMLHTTP"
      ];

      for (const i in names)
        try {
          return new ActiveXObject(names[i]);
        } catch (e) {}
    }

    return null;
  };

  /**
   * This function loads a JSON file and creates a new sigma instance or
   * updates the graph of a given instance. It is possible to give a callback
   * that will be executed at the end of the process.
   *
   * @param  {string}       url      The URL of the JSON file.
   * @param  {object|sigma} sig      A sigma configuration object or a sigma
   *                                 instance.
   * @param  {?function}    callback Eventually a callback to execute after
   *                                 having parsed the file. It will be called
   *                                 with the related sigma instance as
   *                                 parameter.
   */
  sigma.parsers.json = function json(url, sig, callback) {
    let graph;

    const xhr = sigma.utils.xhr();

    if (!xhr)
      throw new Error("XMLHttpRequest not supported, cannot load the file.");

    xhr.open("GET", url, true);
    xhr.onreadystatechange = function onreadystatechange() {
      if (xhr.readyState === 4) {
        graph = JSON.parse(xhr.responseText);

        // Update the instance's graph:
        if (sig instanceof sigma) {
          sig.graph.clear();
          sig.graph.read(graph);

          // ...or instantiate sigma if needed:
        } else if (typeof sig === "object") {
          sig.graph = graph;
          sig = new sigma(sig);

          // ...or it's finally the callback:
        } else if (typeof sig === "function") {
          callback = sig;
          sig = null;
        }

        // Call the callback if specified:
        if (callback) callback(sig || graph);
      }
    };
    xhr.send();
  };
}

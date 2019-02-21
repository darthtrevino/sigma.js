/**
 * This plugin provides a method to retrieve the neighborhood of a node.
 * Basically, it loads a graph and stores it in a headless sigma.classes.graph
 * instance, that you can query to retrieve neighborhoods.
 *
 * It is useful for people who want to provide a neighborhoods navigation
 * inside a big graph instead of just displaying it, and without having to
 * deploy an API or the list of every neighborhoods.
 *
 * This plugin also adds to the graph model a method called "neighborhood".
 * Check the code for more information.
 *
 * Here is how to use it:
 *
 *  > var db = new sigma.plugins.neighborhoods();
 *  > db.load('path/to/my/graph.json', function() {
 *  >   var nodeId = 'anyNodeID';
 *  >   mySigmaInstance
 *  >     .read(db.neighborhood(nodeId))
 *  >     .refresh();
 *  > });
 */
export default function extend(sigma) {
  /**
   * This method takes the ID of node as argument and returns the graph of the
   * specified node, with every other nodes that are connected to it and every
   * edges that connect two of the previously cited nodes. It uses the built-in
   * indexes from sigma's graph model to search in the graph.
   *
   * @param  {string} centerId The ID of the center node.
   * @return {object}          The graph, as a simple descriptive object, in
   *                           the format required by the "read" graph method.
   */
  sigma.classes.graph.addMethod("neighborhood", function neighborhood(
    centerId
  ) {
    // Those two local indexes are here just to avoid duplicates:
    const localNodesIndex = {};
    const localEdgesIndex = {};

    // And here is the resulted graph, empty at the moment:
    const graph = {
      nodes: [],
      edges: []
    };

    // Check that the exists:
    if (!this.nodes(centerId)) return graph;

    // Add center. It has to be cloned to add it the "center" attribute
    // without altering the current graph:
    const node = this.nodes(centerId);
    const center = {};
    center.center = true;
    Object.keys(node).forEach(k => {
      center[k] = node[k];
    });

    localNodesIndex[centerId] = true;
    graph.nodes.push(center);

    // Add neighbors and edges between the center and the neighbors:
    Object.keys(this.allNeighborsIndex[centerId]).forEach(k1 => {
      if (!localNodesIndex[k1]) {
        localNodesIndex[k1] = true;
        graph.nodes.push(this.nodesIndex[k1]);
      }

      Object.keys(this.allNeighborsIndex[centerId][k1]).forEach(k2 => {
        if (!localEdgesIndex[k2]) {
          localEdgesIndex[k2] = true;
          graph.edges.push(this.edgesIndex[k2]);
        }
      });
    });

    // Add edges connecting two neighbors:
    Object.keys(localNodesIndex)
      .filter(k => k !== centerId)
      .forEach(k1 => {
        Object.keys(localNodesIndex)
          .filter(
            k2 => k2 !== centerId && k1 !== k2 && this.allNeighborsIndex[k1][k2]
          )
          .forEach(k2 => {
            Object.keys(this.allNeighborsIndex[k1][k2])
              .filter(k3 => !localEdgesIndex[k3])
              .forEach(k3 => {
                localEdgesIndex[k3] = true;
                graph.edges.push(this.edgesIndex[k3]);
              });
          });
      });

    // Finally, let's return the final graph:
    return graph;
  });

  sigma.utils.pkg("sigma.plugins");

  /**
   * sigma.plugins.neighborhoods constructor.
   */
  sigma.plugins.neighborhoods = function neighborhoods() {
    const graph = new sigma.classes.graph();

    /**
     * This method just returns the neighborhood of a node.
     *
     * @param  {string} centerNodeID The ID of the center node.
     * @return {object}              Returns the neighborhood.
     */
    this.neighborhood = centerNodeID => graph.neighborhood(centerNodeID);

    /**
     * This method loads the JSON graph at "path", stores it in the local graph
     * instance, and executes the callback.
     *
     * @param {string}    path     The path of the JSON graph file.
     * @param {?function} callback Eventually a callback to execute.
     */
    this.load = function load(path, callback) {
      // Quick XHR polyfill:
      const xhr = (() => {
        if (window.XMLHttpRequest) return new XMLHttpRequest();
        if (window.ActiveXObject) {
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
      })();

      if (!xhr)
        throw new Error("XMLHttpRequest not supported, cannot load the data.");

      xhr.open("GET", path, true);
      xhr.onreadystatechange = function orsc() {
        if (xhr.readyState === 4) {
          graph.clear().read(JSON.parse(xhr.responseText));

          if (callback) callback();
        }
      };

      // Start loading the file:
      xhr.send();

      return this;
    };

    /**
     * This method cleans the graph instance "reads" a graph into it.
     *
     * @param {object} g The graph object to read.
     */
    this.read = g => graph.clear().read(g);
  };
}

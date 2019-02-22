/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import * as _helpers from "./utils";

export default sigma => {
  /**
   * GEXF Library
   * =============
   *
   * Author: PLIQUE Guillaume (Yomguithereal)
   * URL: https://github.com/Yomguithereal/gexf-parser
   * Version: 0.1.1
   */

  /**
   * Parser Core Functions
   * ----------------------
   *
   * The XML parser's functions themselves.
   */

  /**
   * Node structure.
   * A function returning an object guarded with default value.
   *
   * @param  {object} properties The node properties.
   * @return {object}            The guarded node object.
   */
  function Node(properties) {
    // Possible Properties
    const node: any = {
      id: properties.id,
      label: properties.label
    };

    if (properties.viz) node.viz = properties.viz;

    if (properties.attributes) node.attributes = properties.attributes;

    return node;
  }

  /**
   * Edge structure.
   * A function returning an object guarded with default value.
   *
   * @param  {object} properties The edge properties.
   * @return {object}            The guarded edge object.
   */
  function Edge(properties) {
    // Possible Properties
    const edge: any = {
      id: properties.id,
      type: properties.type || "undirected",
      label: properties.label || "",
      source: properties.source,
      target: properties.target,
      weight: +properties.weight || 1.0
    };

    if (properties.viz) edge.viz = properties.viz;

    if (properties.attributes) edge.attributes = properties.attributes;

    return edge;
  }

  /**
   * Graph parser.
   * This structure parse a gexf string and return an object containing the
   * parsed graph.
   *
   * @param  {string} xml The xml string of the gexf file to parse.
   * @return {object}     The parsed graph.
   */
  function Graph(xml) {
    const _xml: any = {};

    // Basic Properties
    //------------------
    _xml.els = {
      root: xml.getElementsByTagName("gexf")[0],
      graph: xml.getElementsByTagName("graph")[0],
      meta: xml.getElementsByTagName("meta")[0],
      nodes: xml.getElementsByTagName("node"),
      edges: xml.getElementsByTagName("edge"),
      model: _helpers.getModelTags(xml)
    };

    // Information
    _xml.hasViz = !!_helpers.getAttributeNS(_xml.els.root, "xmlns", "viz");
    _xml.version = _xml.els.root.getAttribute("version") || "1.0";
    _xml.mode = _xml.els.graph.getAttribute("mode") || "static";

    const edgeType = _xml.els.graph.getAttribute("defaultedgetype");
    _xml.defaultEdgetype = edgeType || "undirected";

    // Parser Functions
    //------------------

    // Meta Data
    function _metaData() {
      const metas: any = {};
      if (!_xml.els.meta) return metas;

      // Last modified date
      metas.lastmodifieddate = _xml.els.meta.getAttribute("lastmodifieddate");

      // Other information
      _helpers.nodeListEach(_xml.els.meta.childNodes, child => {
        metas[child.tagName.toLowerCase()] = child.textContent;
      });

      return metas;
    }

    // Model
    function _model(cls) {
      const attributes = [];

      // Iterating through attributes
      if (_xml.els.model[cls])
        _helpers.nodeListEach(_xml.els.model[cls], attr => {
          // Properties
          const properties: any = {
            id: attr.getAttribute("id") || attr.getAttribute("for"),
            type: attr.getAttribute("type") || "string",
            title: attr.getAttribute("title") || ""
          };

          // Defaults
          const defaultEl = _helpers.nodeListToArray(attr.childNodes);

          if (defaultEl.length > 0)
            properties.defaultValue = defaultEl[0].textContent;

          // Creating attribute
          attributes.push(properties);
        });

      return attributes.length > 0 ? attributes : false;
    }

    // Data from nodes or edges
    function _data(model, nodeOrEdge) {
      const data = {};
      const attValuesEls = nodeOrEdge.getElementsByTagName("attvalue");

      // Getting Node Indicated Attributes
      const ah = _helpers.nodeListToHash(attValuesEls, el => {
        const attributes: any = _helpers.namedNodeMapToObject(el.attributes);
        const key = attributes.id || attributes.for;

        // Returning object
        return { key, value: attributes.value };
      });

      // Iterating through model
      model.forEach(a => {
        // Default value?
        data[a.id] =
          !(a.id in ah) && "defaultValue" in a
            ? _helpers.enforceType(a.type, a.defaultValue)
            : _helpers.enforceType(a.type, ah[a.id]);
      });

      return data;
    }

    // Nodes
    function _nodes(model) {
      const nodes = [];

      // Iteration through nodes
      _helpers.nodeListEach(_xml.els.nodes, n => {
        // Basic properties
        const properties: any = {
          id: n.getAttribute("id"),
          label: n.getAttribute("label") || ""
        };

        // Retrieving data from nodes if any
        if (model) properties.attributes = _data(model, n);

        // Retrieving viz information
        if (_xml.hasViz) properties.viz = _nodeViz(n);

        // Pushing node
        nodes.push(Node(properties));
      });

      return nodes;
    }

    // Viz information from nodes
    function _nodeViz(node) {
      const viz: any = {};

      // Color
      const colorEl = _helpers.getFirstElementByTagNS(node, "viz", "color");

      if (colorEl) {
        const color = ["r", "g", "b", "a"].map(c => colorEl.getAttribute(c));
        viz.color = _helpers.getRGB(color);
      }

      // Position
      const posEl = _helpers.getFirstElementByTagNS(node, "viz", "position");
      if (posEl) {
        viz.position = {};

        ["x", "y", "z"].forEach(p => {
          viz.position[p] = +posEl.getAttribute(p);
        });
      }

      // Size
      const sizeEl = _helpers.getFirstElementByTagNS(node, "viz", "size");
      if (sizeEl) viz.size = +sizeEl.getAttribute("value");

      // Shape
      const shapeEl = _helpers.getFirstElementByTagNS(node, "viz", "shape");
      if (shapeEl) viz.shape = shapeEl.getAttribute("value");

      return viz;
    }

    // Edges
    function _edges(model, defaultType) {
      const edges = [];

      // Iteration through edges
      _helpers.nodeListEach(_xml.els.edges, e => {
        // Creating the edge
        const properties: any = _helpers.namedNodeMapToObject(e.attributes);
        if (!("type" in properties)) {
          properties.type = defaultType;
        }

        // Retrieving edge data
        if (model) properties.attributes = _data(model, e);

        // Retrieving viz information
        if (_xml.hasViz) properties.viz = _edgeViz(e);

        edges.push(Edge(properties));
      });

      return edges;
    }

    // Viz information from edges
    function _edgeViz(edge) {
      const viz: any = {};

      // Color
      const colorEl = _helpers.getFirstElementByTagNS(edge, "viz", "color");

      if (colorEl) {
        const color = ["r", "g", "b", "a"].map(c => colorEl.getAttribute(c));
        viz.color = _helpers.getRGB(color);
      }

      // Shape
      const shapeEl = _helpers.getFirstElementByTagNS(edge, "viz", "shape");
      if (shapeEl) viz.shape = shapeEl.getAttribute("value");

      // Thickness
      const thickEl = _helpers.getFirstElementByTagNS(edge, "viz", "thickness");
      if (thickEl) viz.thickness = +thickEl.getAttribute("value");

      return viz;
    }

    // Returning the Graph
    //---------------------
    const nodeModel = _model("node");
    const edgeModel = _model("edge");

    const graph: any = {
      version: _xml.version,
      mode: _xml.mode,
      defaultEdgeType: _xml.defaultEdgetype,
      meta: _metaData(),
      model: {},
      nodes: _nodes(nodeModel),
      edges: _edges(edgeModel, _xml.defaultEdgetype)
    };

    if (nodeModel) graph.model.node = nodeModel;
    if (edgeModel) graph.model.edge = edgeModel;

    return graph;
  }

  /**
   * Public API
   * -----------
   *
   * User-accessible functions.
   */

  // Fetching GEXF with XHR
  function fetch(gexfUrl, callback) {
    const xhr = sigma.utils.xhr();
    if (!xhr)
      throw new Error("XMLHttpRequest not supported, cannot load the file.");

    // Async?
    const async = typeof callback === "function";

    let getResult;

    // If we can't override MIME type, we are on IE 9
    // We'll be parsing the response string then.
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType("text/xml");
      getResult = r => r.responseXML;
    } else {
      getResult = r => {
        const p = new DOMParser();
        return p.parseFromString(r.responseText, "application/xml");
      };
    }

    xhr.open("GET", gexfUrl, async);

    if (async)
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) callback(getResult(xhr));
      };

    xhr.send();

    return async ? xhr : getResult(xhr);
  }

  // Parsing the GEXF File
  function parse(gexf) {
    return Graph(gexf);
  }

  // Fetch and parse the GEXF File
  function fetchAndParse(gexfUrl, callback) {
    if (typeof callback === "function") {
      return fetch(gexfUrl, gexf => callback(Graph(gexf)));
    }
    return Graph((fetch as any)(gexfUrl));
  }

  return {
    // Functions
    parse,
    fetch: fetchAndParse,

    // Version
    version: "0.1.1"
  };
};

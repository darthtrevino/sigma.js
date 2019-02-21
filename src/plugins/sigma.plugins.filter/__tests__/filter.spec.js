import sigma from "../../../core/index";
import plugin from "../index";
plugin(sigma);

/* eslint-disable no-func-assign, no-shadow */
describe("Plugin: sigma.plugins.filter", () => {
  it("Custom graph methods", () => {
    const myGraph = new sigma.classes.graph();
    myGraph.read({
      nodes: [
        {
          id: "n0",
          label: "Node 0",
          myNodeAttr: 123
        },
        {
          id: "n1",
          label: "Node 1"
        },
        {
          id: "n2",
          label: "Node 2"
        },
        {
          id: "n3",
          label: "Node 3"
        }
      ],
      edges: [
        {
          id: "e0",
          source: "n0",
          target: "n1",
          myEdgeAttr: 123
        },
        {
          id: "e1",
          source: "n1",
          target: "n2"
        },
        {
          id: "e2",
          source: "n1",
          target: "n3"
        },
        {
          id: "e3",
          source: "n2",
          target: "n3"
        }
      ]
    });

    expect(myGraph.adjacentNodes("n0")).toEqual(
      [myGraph.nodes("n1")],
      '"adjacentNodes" returns the adjacent nodes of a specified node'
    );

    expect(myGraph.adjacentEdges("n0")).toEqual(
      [myGraph.edges("e0")],
      '"adjacentEdges" returns the adjacent edges of a specified node'
    );
  });

  it("API", () => {
    const s = new sigma();
    const graph = {
      nodes: [
        {
          id: "n0",
          label: "Node 0",
          myNodeAttr: 0
        },
        {
          id: "n1",
          label: "Node 1",
          myNodeAttr: 1
        },
        {
          id: "n2",
          label: "Node 2",
          myNodeAttr: 2
        },
        {
          id: "n3",
          label: "Node 3",
          myNodeAttr: -1
        },
        {
          id: "n4",
          label: "Node 4"
        }
      ],
      edges: [
        {
          id: "e0",
          source: "n0",
          target: "n1",
          myEdgeAttr: 0
        },
        {
          id: "e1",
          source: "n1",
          target: "n2",
          myEdgeAttr: 1
        },
        {
          id: "e2",
          source: "n1",
          target: "n3",
          myEdgeAttr: 2
        },
        {
          id: "e3",
          source: "n2",
          target: "n3",
          myEdgeAttr: -1
        },
        {
          id: "e4",
          source: "n0",
          target: "n0"
        }
      ]
    };

    // Initialize the filter:
    const filter = new sigma.plugins.filter(s);

    s.graph.read(graph);

    // helper function
    function hiddenNodes() {
      return s.graph.nodes().filter(n => n.hidden);
    }

    // helper function
    function hiddenEdges() {
      return s.graph.edges().filter(e => e.hidden);
    }

    // Show non-isolated nodes only
    function degreePredicate(n) {
      return this.degree(n.id) > 0;
    }

    // Show edges without the myEdgeAttr attribute or with myEdgeAttr > 1
    function myEdgeAttrPredicate(e) {
      return e.myEdgeAttr === undefined || e.myEdgeAttr > 1;
    }

    // Register the filter
    filter.nodesBy(degreePredicate, "degree");

    expect(hiddenNodes()).toEqual(
      [],
      'A "nodesBy" filter is not applied automatically'
    );

    // Apply the filter
    filter.apply();

    expect(hiddenNodes()).toEqual(
      [s.graph.nodes("n4")],
      '"apply" applies a nodesBy filter'
    );

    // Undo this filter
    filter.undo("degree").apply();

    expect(hiddenNodes()).toEqual([], '"undo(a)" undoes the specified filter');

    // Register another filter
    filter.neighborsOf("n0").apply();

    expect(hiddenNodes()).toEqual(
      [s.graph.nodes("n2"), s.graph.nodes("n3"), s.graph.nodes("n4")],
      '"neighborsOf" hides all nodes which are not linked to the specified node'
    );

    // Undo all filters
    filter.undo().apply();

    // Register an edge filter
    filter.edgesBy(myEdgeAttrPredicate).apply();

    expect(hiddenEdges()).toEqual(
      [s.graph.edges("e0"), s.graph.edges("e1"), s.graph.edges("e3")],
      '"apply" applies an edgesBy filter'
    );

    // Register two filters and apply them
    filter
      .nodesBy(degreePredicate)
      .edgesBy(myEdgeAttrPredicate)
      .apply();

    // Undo all filters
    filter.undo().apply();

    expect(hiddenNodes().concat(hiddenEdges())).toEqual(
      [],
      "All filters are undone at once"
    );

    // Register two filters and apply them
    filter
      .nodesBy(degreePredicate, "degree")
      .edgesBy(myEdgeAttrPredicate, "attr")
      .apply();

    expect(filter.export().map(o => o.key)).toEqual(
      ["degree", "attr"],
      "The filters chain is exported"
    );

    // Clear the filters chain
    filter.clear();

    expect(filter.export()).toEqual([], "The filters chain is cleared");
    // Undo all filters
    filter.undo().apply();

    // nodesBy X > undo > nodesBy Y > apply
    filter
      .nodesBy(degreePredicate, "degree0")
      .undo()
      .nodesBy(function degree(n) {
        return this.degree(n.id) > 1;
      }, "degree1")
      .apply();

    expect(hiddenNodes()).toEqual(
      [s.graph.nodes("n4")],
      '"undo" undoes the filters before it in the chain, and not the filters after it'
    );

    // Call "apply" multiple times
    filter.apply().apply();

    expect(hiddenNodes()).toEqual(
      [s.graph.nodes("n4")],
      '"apply" is called multiple times'
    );

    // Call "undo" with multiple arguments
    filter
      .nodesBy(degreePredicate, "degree0")
      .undo("degree0", "degree1")
      .apply();

    expect(hiddenNodes()).toEqual(
      [],
      '"undo" is called with multiple arguments'
    );

    // Import an empty chain
    filter.import([]);

    expect(filter.export().length).toEqual(0, "The empty chain is imported");

    // Import a chain of filters
    const chain = [
      {
        key: "my-filter",
        predicate: degreePredicate,
        processor: "filter.processors.nodes"
      }
    ];

    filter.import(chain).apply();

    expect(
      filter.export().map(({ key, predicate, processor }) => ({
        key,
        predicate: predicate.toString(),
        processor
      }))
    ).toEqual(
      [
        {
          key: "my-filter",
          predicate: degreePredicate.toString(),
          processor: "filter.processors.nodes"
        }
      ],
      "The filters chain is imported"
    );

    // export > import > export
    const dumpedChain = filter.import(filter.export()).export();

    expect(
      chain.map(o => {
        return {
          key: o.key,
          predicate: o.predicate.toString(),
          processor: o.processor
        };
      })
    ).toEqual(
      dumpedChain.map(o => {
        return {
          key: o.key,
          predicate: o.predicate.toString(),
          processor: o.processor
        };
      }),
      "The exported filters chain is imported"
    );

    // check chain duplication
    filter.clear();

    expect(dumpedChain.length).toEqual(
      1,
      "The exported chain is a deep copy of the internal chain"
    );

    // check chain duplication
    filter.import(chain);
    chain.length = 0;
    degreePredicate = null;

    expect(
      filter.export().map(o => {
        return {
          key: o.key,
          predicate: o.predicate.toString().replace(/\s+/g, " "),
          processor: o.processor
        };
      })
    ).toEqual(
      [
        {
          key: "my-filter",
          predicate: function degreePredicate(n) {
            return this.degree(n.id) > 0;
          }
            .toString()
            .replace(/\s+/g, " "),
          processor: "filter.processors.nodes"
        }
      ],
      "The internal chain is a deep copy of the imported chain"
    );

    function noop() {}

    expect(() => filter.nodesBy(noop, 5)).toThrow(
      /The filter key "5" must be a string./,
      '"nodesBy" with a wrong key type throws an error.'
    );

    expect(() => filter.edgesBy(noop, "")).toThrow(
      /The filter key must be a non-empty string./,
      '"edgesBy" with a wrong key type throws an error.'
    );

    expect(() => filter.neighborsOf(0)).toThrow(
      /The node id "0" must be a string./,
      '"neighborsOf" with a wrong node id type throws an error.'
    );

    expect(() => filter.neighborsOf("")).toThrow(
      /The node id must be a non-empty string./,
      '"neighborsOf" with a wrong node id type throws an error.'
    );

    expect(() => filter.nodesBy(noop, "a").edgesBy(noop, "a")).toThrow(
      /The filter "a" already exists./,
      "Registering two filters with the same key throws an error."
    );
  });
});

import Configurable from "../Configurable";
import Graph from "../Graph";
import { Node, Edge } from "../../../interfaces";

function getGraphData(): { nodes: Partial<Node>[]; edges: Partial<Edge>[] } {
  return {
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
      },
      {
        id: "e4",
        source: "n2",
        target: "n2"
      }
    ]
  };
}

function createGraph(immutable: boolean, clone: boolean) {
  const opts = { immutable, clone };
  const settings = Configurable(opts);
  const data = getGraphData();
  const graph = new Graph(settings);
  data.nodes.forEach(n => graph.addNode(n));
  data.edges.forEach(e => graph.addEdge(e));
  return { graph, data };
}

describe("The Graph Class", () => {
  it("Methods and attached functions", () => {
    let counter;
    const colorPalette = { Person: "#C3CBE1", Place: "#9BDEBD" };

    counter = 0;
    Graph.attach("addNode", "counterInc", () => counter++);

    Graph.attachBefore("addNode", "applyNodeColorPalette", n => {
      // eslint-disable-next-line no-param-reassign
      n.color = colorPalette[n.category];
    });

    expect(false).toEqual(
      Graph.hasMethod("getNodeLabel")
      //      "sigma.classes.hasMethod returns false if the method does not exist."
    );

    Graph.addMethod("getNodeLabel", function getNodeLabel(nId) {
      return (this.nodesIndex[nId] || {}).label;
    });

    expect(true).toEqual(
      Graph.hasMethod("getNodeLabel")
      //    "sigma.classes.hasMethod returns true if the method has been added with addMethod."
    );

    expect(true).toEqual(
      Graph.hasMethod("hasMethod")
      //      "sigma.classes.hasMethod returns true if the method is implemented in the core."
    );

    const myGraph = new Graph();
    myGraph.addNode({ id: "n0", label: "My node", category: "Person" });
    expect(1).toEqual(
      counter
      //    "Attached functions are effectively executed when the anchor method is called."
    );
    expect(myGraph.nodes("n0")[0].color).toEqual(
      "#C3CBE1"
      //  'Attached "before" functions are effectively executed before when the anchor method is called.'
    );
    expect((myGraph as any).getNodeLabel("n0")).toEqual(
      "My node"
      //'Custom methods work, can have arguments, and have access to the data in their scope (through "this").'
    );

    function noop() {}

    expect(() => Graph.attach("addNode", "counterInc", noop)).toThrow(
      /A function "counterInc" is already attached to the method "addNode"/
      //      "Attaching a function to a method when there is already a function attached to this method under the same key throws an error."
    );

    expect(() => Graph.attach("undefinedMethod", "counterInc", noop)).toThrow(
      /The method "undefinedMethod" does not exist./
      //    "Attaching a function to an unexisting method when throws an error."
    );

    expect(() =>
      Graph.attachBefore("addNode", "applyNodeColorPalette", noop)
    ).toThrow(
      /A function "applyNodeColorPalette" is already attached to the method "addNode"/
      //  'Attaching a "before" function to a method when there is already a "before" function attached to this method under the same key throws an error.'
    );

    expect(() =>
      Graph.attachBefore("undefinedMethod", "applyNodeColorPalette", noop)
    ).toThrow(
      /The method "undefinedMethod" does not exist./
      //'Attaching a "before" function to an unexisting method when throws an error.'
    );

    expect(() => Graph.addMethod("getNodeLabel", noop)).toThrow(
      /The method "getNodeLabel" already exists./
      //      "Attaching a method whose name is already referenced throws an error."
    );
  });

  it("Builtin indexes", () => {
    const graph = {
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
        }
      ]
    };

    Graph.addMethod("retrieveIndexes", function getIndexes() {
      return {
        inIndex: this.inNeighborsIndex,
        outIndex: this.outNeighborsIndex,
        allIndex: this.allNeighborsIndex,
        inCount: this.inNeighborsCount,
        outCount: this.outNeighborsCount,
        allCount: this.allNeighborsCount
      };
    });

    const g = new Graph();
    g.read(graph);

    const index = (g as any).retrieveIndexes();

    expect(index.inIndex).toEqual(
      {
        n0: {},
        n1: {
          n0: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          }
        },
        n2: {
          n1: {
            e1: {
              id: "e1",
              source: "n1",
              target: "n2",
              type: "def"
            }
          }
        }
      }
      //      "Incoming index up to date"
    );

    expect(index.inCount).toEqual(
      {
        n0: 0,
        n1: 1,
        n2: 1
      }
      //    "Incoming count up to date"
    );

    expect(index.outIndex).toEqual(
      {
        n0: {
          n1: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          }
        },
        n1: {
          n2: {
            e1: {
              id: "e1",
              source: "n1",
              target: "n2",
              type: "def"
            }
          }
        },
        n2: {}
      }
      //  "Outcoming index up to date"
    );

    expect(index.outCount).toEqual(
      {
        n0: 1,
        n1: 1,
        n2: 0
      }
      //"Outcoming count up to date"
    );

    expect(index.allIndex).toEqual(
      {
        n0: {
          n1: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          }
        },
        n1: {
          n0: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          },
          n2: {
            e1: {
              id: "e1",
              source: "n1",
              target: "n2",
              type: "def"
            }
          }
        },
        n2: {
          n1: {
            e1: {
              id: "e1",
              source: "n1",
              target: "n2",
              type: "def"
            }
          }
        }
      }
      //      "Full index up to date"
    );

    expect(index.allCount).toEqual(
      {
        n0: 1,
        n1: 2,
        n2: 1
      }
      //      "Full count up to date"
    );

    g.dropNode("n2");

    expect(index.inIndex).toEqual(
      {
        n0: {},
        n1: {
          n0: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          }
        }
      }
      //      "Incoming index up to date after having dropped a node"
    );

    expect(index.inCount).toEqual(
      {
        n0: 0,
        n1: 1
      }
      //      "Incoming count up to date after having dropped a node"
    );

    expect(index.outIndex).toEqual(
      {
        n0: {
          n1: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          }
        },
        n1: {}
      }
      //      "Outcoming index up to date after having dropped a node"
    );

    expect(index.outCount).toEqual(
      {
        n0: 1,
        n1: 0
      }
      //      "Outcoming count up to date after having dropped a node"
    );

    expect(index.allIndex).toEqual(
      {
        n0: {
          n1: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          }
        },
        n1: {
          n0: {
            e0: {
              id: "e0",
              myEdgeAttr: 123,
              source: "n0",
              target: "n1",
              type: "def"
            }
          }
        }
      }
      //      "Full index up to date after having dropped a node"
    );

    expect(index.allCount).toEqual(
      {
        n0: 1,
        n1: 1
      }
      //      "Full count up to date after having dropped a node"
    );

    g.dropEdge("e0");

    expect(index.inIndex).toEqual(
      {
        n0: {},
        n1: {}
      }
      //      "Incoming index up to date after having dropped an edge"
    );

    expect(index.inCount).toEqual(
      {
        n0: 0,
        n1: 0
      }
      //      "Incoming count up to date after having dropped an edge"
    );

    expect(index.outIndex).toEqual(
      {
        n0: {},
        n1: {}
      }
      //      "Outcoming index up to date after having dropped an edge"
    );

    expect(index.outCount).toEqual(
      {
        n0: 0,
        n1: 0
      }
      //      "Outcoming count up to date after having dropped an edge"
    );

    expect(index.allIndex).toEqual(
      {
        n0: {},
        n1: {}
      }
      //      "Full index up to date after having dropped an edge"
    );

    expect(index.allCount).toEqual(
      {
        n0: 0,
        n1: 0
      }
      //      "Full count up to date after having dropped an edge"
    );
  });

  it("Custom indexes", () => {
    Graph.addIndex("nodesCount", {
      constructor() {
        this.nodesCount = 0;
      },
      addNode() {
        this.nodesCount++;
      },
      dropNode() {
        this.nodesCount--;
      },
      clear() {
        this.nodesCount = 0;
      }
    });

    Graph.addMethod("getNodesCount", function getNodeCount() {
      return this.nodesCount;
    });

    const myGraph = new Graph();
    myGraph
      .addNode({ id: "n0" })
      .addNode({ id: "n1" })
      .dropNode("n0");
    expect(1).toEqual(
      (myGraph as any).getNodesCount()
      //      "Indexes work, and the scope is effectively shared with custom methods."
    );
  });

  describe("node mutability", () => {
    it("cannot alter nodes when the graph is immutable", () => {
      const { graph, data } = createGraph(true, true);
      expect(() => {
        graph.nodes(data.nodes[0].id)[0].id = "new_n0";
      }).toThrow();
      expect(data.nodes[0].id).toEqual(graph.nodes(data.nodes[0].id)[0].id);
    });

    it("preserves object identity internally when clone is false", () => {
      const { graph, data } = createGraph(true, false);
      expect([data.nodes[1]]).toEqual(graph.nodes(data.nodes[1].id));
    });

    it("allows alteration to node ids when graphs are mutable", () => {
      const { graph, data } = createGraph(false, true);
      const node = graph.nodes(data.nodes[1].id)[0];
      node.id = "new_n0";
      expect("new_n0").toEqual(node.id);
      node.id = "n1";
    });

    it("allows alteration to other node props when graph is mutable", () => {
      const { graph, data } = createGraph(false, false);
      graph.nodes(data.nodes[0].id)[0].label = "New node 0";
      expect("New node 0").toEqual(graph.nodes(data.nodes[0].id)[0].label);
      graph.nodes(data.nodes[0].id)[0].label = "Node 0";
    });
  });

  describe(".nodes()", () => {
    it("returns a copy of the nodes array when .nodes() is called without arguments", () => {
      const { graph } = createGraph(true, false);
      expect(graph.nodes()).not.toBe(graph.nodes());
    });

    it("returns undefined on node lookup of an unknown id", () => {
      const { graph } = createGraph(true, false);
      expect(graph.nodes("unexisting_id")).toEqual([undefined]);
    });

    it("returns an array of nodes when an array of ids is passed into .nodes()", () => {
      const { graph, data } = createGraph(true, false);
      expect(graph.nodes("n0", "n1", "n0")).toEqual([
        data.nodes[0],
        data.nodes[1],
        data.nodes[0]
      ]);
    });

    it("throws when invalid id arguments are used", () => {
      const { graph } = createGraph(true, false);
      expect(() => graph.nodes("n0", "n1", {} as string)).toThrow(
        /nodes: Wrong arguments/
      );
    });
  });

  describe("addNode/dropNode", () => {
    it("throws if a node id is double-added", () => {
      const { graph, data } = createGraph(true, false);
      expect(() => graph.addNode(data.nodes[0])).toThrow(
        /The node "n0" already exists./
      );
    });

    it("can be used to add/drop nodes", () => {
      const { graph } = createGraph(true, false);
      expect(graph.nodes("n1")).toBeDefined();
      expect(graph.nodes("n2")).toBeDefined();

      // drop
      graph.dropNode("n1");
      expect(graph.nodes("n1")).toEqual([undefined]);
      graph.dropNode("n2");
      expect(graph.nodes("n2")).toEqual([undefined]);
    });
  });

  describe("addEdge", () => {
    it("can add an edge correctly with properties preserved ", () => {
      const { graph, data } = createGraph(true, false);
      expect([data.edges[0]]).toEqual(graph.edges(data.edges[0].id));
    });
  });

  describe("edge mutability", () => {
    it("creates new objects when clone is set to true", () => {
      const { graph, data } = createGraph(true, true);
      expect([data.edges[0]]).not.toBe(graph.edges(data.edges[0].id));
    });

    it("does not create new objects when clone is set to false", () => {
      const { graph, data } = createGraph(false, false);
      const firstEdge = data.edges[0];
      const { id } = firstEdge;
      expect(firstEdge).toBe(graph.edges(id)[0]);
    });

    it("throws if an edge is altered when immutable is set to true", () => {
      const { graph, data } = createGraph(true, true);
      expect(() => {
        graph.edges(data.edges[0].id)[0].id = "new_e0";
      }).toThrow();
      expect(() => {
        graph.edges(data.edges[0].id)[0].source = "undefined_node";
      }).toThrow();
      expect(() => {
        graph.edges(data.edges[0].id)[0].target = "undefined_node";
      }).toThrow();
    });

    it("allows edge sources, targets, and IDS to be writable when immutable is false", () => {
      const { graph, data } = createGraph(false, true);
      const [edge] = graph.edges(data.edges[1].id);
      edge.id = "new_e0";
      edge.source = "undefined_node";
      edge.target = "undefined_node";
      expect(["new_e0", "undefined_node", "undefined_node"]).toEqual([
        edge.id,
        edge.source,
        edge.target
      ]);
    });

    it("allows other edge properties to be writable when immutable is false", () => {
      const { graph, data } = createGraph(false, true);
      const [edge] = graph.edges(data.edges[1].id);
      edge.id = "e1";
      edge.source = "n1";
      edge.target = "n2";

      (graph.edges(data.edges[0].id)[0] as any).myEdgeAttr = 456;
      expect(456).toEqual(
        (graph.edges(data.edges[0].id)[0] as any).myEdgeAttr
        //      "Other edge attributes are writable."
      );
    });

    describe(".edges()", () => {
      it("returns a copy of the edge array without arguments", () => {
        const { graph } = createGraph(false, true);
        expect(graph.edges()).not.toBe(graph.edges());
      });

      it("does not throw an error when an unknown id is used", () => {
        const { graph } = createGraph(false, true);
        expect(graph.edges("unexisting_id")).toEqual([undefined]);
      });

      it("returns an array of edges when an id array is used", () => {
        const { graph, data } = createGraph(false, true);
        expect(graph.edges("e0", "e0").map(e => e.id)).toEqual(["e0", "e0"]);
      });

      it("throws when invalid id types are used", () => {
        const { graph } = createGraph(false, true);
        expect(() => graph.edges("e0", {} as string)).toThrow(
          /edges: Wrong arguments/
        );
      });

      it("throws if an edge is already present", () => {
        const { graph, data } = createGraph(false, true);
        expect(() => graph.addEdge(data.edges[0])).toThrow(
          /The edge "e0" already exists./
        );
      });
    });
  });

  describe("edge dropping and clearing", () => {
    it("can drop and clear edges", () => {
      const { graph, data } = createGraph(false, true);

      graph.dropNode("n0");
      expect(graph.nodes().map(n => n.id)).toEqual(
        ["n1", "n2", "n3"]
        //      '"dropNode" actually drops the node.'
      );
      expect(graph.edges().map(e => e.id)).toEqual(
        ["e1", "e2", "e3", "e4"]
        //      '"dropNode" also kills the edges linked to the related nodes..'
      );

      expect(() => graph.dropNode("n0")).toThrow(
        /The node "n0" does not exist./
        //      "Droping an unexisting node throws an error."
      );

      graph.dropEdge("e1");
      expect(graph.edges().map(e => e.id)).toEqual(
        ["e2", "e3", "e4"]
        //      '"dropEdge" actually drops the edge.'
      );

      graph.dropEdge("e4");
      expect(graph.edges().map(e => e.id)).toEqual(
        ["e2", "e3"]
        //      '"dropEdge" with a self loops works. (#286)'
      );

      expect(() => graph.dropEdge("e1")).toThrow(
        /The edge "e1" does not exist./
        //      "Droping an unexisting edge throws an error."
      );

      // Reinitialize the graph:
      graph.addNode(data.nodes[0]);
      graph.addEdge(data.edges[0]);
      graph.addEdge(data.edges[1]);

      graph.clear();
      expect([graph.nodes(), graph.edges()]).toEqual(
        [[], []]
        //      '"clear" empties the nodes and edges arrays.'
      );
    });

    describe("read", () => {
      it("can read in data", () => {
        const graph = new Graph();
        const data = getGraphData();
        graph.read(data as any);

        expect(graph.nodes().map(n => n.id)).toEqual(data.nodes.map(n => n.id));
        expect(graph.edges().map(e => e.id)).toEqual(data.edges.map(e => e.id));
        expect(graph.edges().map(e => e.source)).toEqual(
          data.edges.map(e => e.source)
        );
        expect(graph.edges().map(e => e.target)).toEqual(
          data.edges.map(e => e.target)
        );
      });
    });
  });
});

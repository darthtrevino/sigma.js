import {
  SigmaLibrary,
  Edge,
  Node,
  Renderer,
  Captor,
  SigmaDispatchedEvent as SigmaEvent,
  Keyed
} from "../interfaces";

export default function configure(sigma: SigmaLibrary) {
  /**
   * This helper will bind any no-DOM renderer (for instance canvas or WebGL)
   * to its captors, to properly dispatch the good events to the sigma instance
   * to manage clicking, hovering etc...
   *
   */
  function bindEvents(this: Renderer, prefix: string) {
    let mX: number;
    let mY: number;
    const self = this;

    function getNodes(e: any): Node[] {
      if (e) {
        mX = "x" in e.data ? e.data.x : mX;
        mY = "y" in e.data ? e.data.y : mY;
      }

      let j;
      let n;
      let x;
      let y;
      let s;
      let inserted;
      const selected: Node[] = [];
      const modifiedX = mX + self.width / 2;
      const modifiedY = mY + self.height / 2;
      const point = self.camera.cameraPosition(mX, mY);
      const nodes = self.camera.quadtree!.point(point.x, point.y);

      if (nodes.length)
        for (let i = 0; i < nodes.length; i++) {
          n = nodes[i];
          x = n[`${prefix}x`];
          y = n[`${prefix}y`];
          s = n[`${prefix}size`];

          if (
            !n.hidden &&
            modifiedX > x - s &&
            modifiedX < x + s &&
            modifiedY > y - s &&
            modifiedY < y + s &&
            Math.sqrt((modifiedX - x) ** 2 + (modifiedY - y) ** 2) < s
          ) {
            // Insert the node:
            inserted = false;

            for (j = 0; j < selected.length; j++)
              if (n.size > selected[j].size) {
                selected.splice(j, 0, n);
                inserted = true;
                break;
              }

            if (!inserted) selected.push(n);
          }
        }

      return selected;
    }

    function getEdges(e: any): Edge[] {
      if (!self.settings("enableEdgeHovering")) {
        // No event if the setting is off:
        return [];
      }

      const isCanvas =
        sigma.renderers.canvas && self instanceof sigma.renderers.canvas;

      if (!isCanvas) {
        // A quick hardcoded rule to prevent people from using this feature
        // with the WebGL renderer (which is not good enough at the moment):
        throw new Error(
          "The edge events feature is not compatible with the WebGL renderer"
        );
      }

      if (e) {
        mX = "x" in e.data ? e.data.x : mX;
        mY = "y" in e.data ? e.data.y : mY;
      }

      let i;
      let j;
      let l;
      let a;
      let edge;
      let s;
      const maxEpsilon = self.settings("edgeHoverPrecision");
      let cp;
      const nodeIndex: Keyed<Node> = {};
      let inserted;
      const selected: Edge[] = [];
      const modifiedX = mX + self.width / 2;
      const modifiedY = mY + self.height / 2;
      const point = self.camera.cameraPosition(mX, mY);
      let edges: Edge[] = [];

      if (isCanvas) {
        const nodesOnScreen = self.camera.quadtree!.area(
          self.camera.getRectangle(self.width, self.height)
        );
        for (a = nodesOnScreen, i = 0, l = a.length; i < l; i++)
          nodeIndex[a[i].id] = a[i];
      }

      if (self.camera.edgequadtree !== undefined) {
        edges = self.camera.edgequadtree.point(point.x, point.y);
      }

      function insertEdge(ieSelected: any, ieEdge: any) {
        inserted = false;

        for (j = 0; j < ieSelected.length; j++)
          if (ieEdge.size > ieSelected[j].size) {
            ieSelected.splice(j, 0, ieEdge);
            inserted = true;
            break;
          }

        if (!inserted) ieSelected.push(ieEdge);
      }

      if (edges.length)
        edges.forEach(edge => {
          const [source, target] = self.graph.nodes(edge.source, edge.target);
          // (HACK) we can't get edge[prefix + 'size'] on WebGL renderer:
          s = edge[`${prefix}size`] || edge[`read_${prefix}size`];

          // First, let's identify which edges are drawn. To do this, we keep
          // every edges that have at least one extremity displayed according to
          // the quadtree and the "hidden" attribute. We also do not keep hidden
          // edges.
          // Then, let's check if the mouse is on the edge (we suppose that it
          // is a line segment).

          if (
            !edge.hidden &&
            !source.hidden &&
            !target.hidden &&
            (!isCanvas || (nodeIndex[edge.source] || nodeIndex[edge.target])) &&
            sigma.utils.geom.getDistance(
              source[`${prefix}x`],
              source[`${prefix}y`],
              modifiedX,
              modifiedY
            ) > source[`${prefix}size`] &&
            sigma.utils.geom.getDistance(
              target[`${prefix}x`],
              target[`${prefix}y`],
              modifiedX,
              modifiedY
            ) > target[`${prefix}size`]
          ) {
            if (edge.type === "curve" || edge.type === "curvedArrow") {
              if (source.id === target.id) {
                cp = sigma.utils.getSelfLoopControlPoints(
                  source[`${prefix}x`],
                  source[`${prefix}y`],
                  source[`${prefix}size`]
                );
                if (
                  sigma.utils.geom.isPointOnBezierCurve(
                    modifiedX,
                    modifiedY,
                    source[`${prefix}x`],
                    source[`${prefix}y`],
                    target[`${prefix}x`],
                    target[`${prefix}y`],
                    cp.x1,
                    cp.y1,
                    cp.x2,
                    cp.y2,
                    Math.max(s, maxEpsilon)
                  )
                ) {
                  insertEdge(selected, edge);
                }
              } else {
                cp = sigma.utils.geom.getQuadraticControlPoint(
                  source[`${prefix}x`],
                  source[`${prefix}y`],
                  target[`${prefix}x`],
                  target[`${prefix}y`]
                );
                if (
                  sigma.utils.geom.isPointOnQuadraticCurve(
                    modifiedX,
                    modifiedY,
                    source[`${prefix}x`],
                    source[`${prefix}y`],
                    target[`${prefix}x`],
                    target[`${prefix}y`],
                    cp.x,
                    cp.y,
                    Math.max(s, maxEpsilon)
                  )
                ) {
                  insertEdge(selected, edge);
                }
              }
            } else if (
              sigma.utils.geom.isPointOnSegment(
                modifiedX,
                modifiedY,
                source[`${prefix}x`],
                source[`${prefix}y`],
                target[`${prefix}x`],
                target[`${prefix}y`],
                Math.max(s, maxEpsilon)
              )
            ) {
              insertEdge(selected, edge);
            }
          }
        });

      return selected;
    }

    function bindCaptor(captor: Captor) {
      let nodes;
      let edges;
      let overNodes: Keyed<Node> = {};
      let overEdges: Keyed<Edge> = {};

      function onClick(e: SigmaEvent) {
        if (!self.settings("eventsEnabled")) return;

        self.dispatchEvent("click", e.data);
        nodes = getNodes(e);
        edges = getEdges(e);

        if (nodes.length) {
          self.dispatchEvent("clickNode", {
            node: nodes[0],
            captor: e.data
          });
          self.dispatchEvent("clickNodes", {
            node: nodes,
            captor: e.data
          });
        } else if (edges.length) {
          self.dispatchEvent("clickEdge", {
            edge: edges[0],
            captor: e.data
          });
          self.dispatchEvent("clickEdges", {
            edge: edges,
            captor: e.data
          });
        } else self.dispatchEvent("clickStage", { captor: e.data });
      }

      function onDoubleClick(e: SigmaEvent) {
        if (!self.settings("eventsEnabled")) return;

        self.dispatchEvent("doubleClick", e.data);

        nodes = getNodes(e);
        edges = getEdges(e);

        if (nodes.length) {
          self.dispatchEvent("doubleClickNode", {
            node: nodes[0],
            captor: e.data
          });
          self.dispatchEvent("doubleClickNodes", {
            node: nodes,
            captor: e.data
          });
        } else if (edges.length) {
          self.dispatchEvent("doubleClickEdge", {
            edge: edges[0],
            captor: e.data
          });
          self.dispatchEvent("doubleClickEdges", {
            edge: edges,
            captor: e.data
          });
        } else self.dispatchEvent("doubleClickStage", { captor: e.data });
      }

      function onRightClick(e: SigmaEvent) {
        if (!self.settings("eventsEnabled")) return;

        self.dispatchEvent("rightClick", e.data);

        nodes = getNodes(e);
        edges = getEdges(e);

        if (nodes.length) {
          self.dispatchEvent("rightClickNode", {
            node: nodes[0],
            captor: e.data
          });
          self.dispatchEvent("rightClickNodes", {
            node: nodes,
            captor: e.data
          });
        } else if (edges.length) {
          self.dispatchEvent("rightClickEdge", {
            edge: edges[0],
            captor: e.data
          });
          self.dispatchEvent("rightClickEdges", {
            edge: edges,
            captor: e.data
          });
        } else self.dispatchEvent("rightClickStage", { captor: e.data });
      }

      function onOut(e: SigmaEvent) {
        if (!self.settings("eventsEnabled")) return;

        let i;
        let l;
        let le;
        const outNodes: Node[] = [];
        const outEdges: Edge[] = [];

        Object.keys(overNodes).forEach(k => outNodes.push(overNodes[k]));

        overNodes = {};
        // Dispatch both single and multi events:
        for (i = 0, l = outNodes.length; i < l; i++)
          self.dispatchEvent("outNode", {
            node: outNodes[i],
            captor: e.data
          });
        if (outNodes.length)
          self.dispatchEvent("outNodes", {
            nodes: outNodes,
            captor: e.data
          });

        overEdges = {};
        // Dispatch both single and multi events:
        for (i = 0, le = outEdges.length; i < le; i++)
          self.dispatchEvent("outEdge", {
            edge: outEdges[i],
            captor: e.data
          });
        if (outEdges.length)
          self.dispatchEvent("outEdges", {
            edges: outEdges,
            captor: e.data
          });
      }

      function onMove(e: SigmaEvent) {
        if (!self.settings("eventsEnabled")) return;

        nodes = getNodes(e);
        edges = getEdges(e);

        let i;
        let node;
        let edge;
        const newOutNodes: Node[] = [];
        const newOverNodes: Node[] = [];
        const currentOverNodes: Keyed<Node> = {};
        let l = nodes.length;
        const newOutEdges: Edge[] = [];
        const newOverEdges: Edge[] = [];
        const currentOverEdges: Keyed<Edge> = {};
        let le = edges.length;

        // Check newly overred nodes:
        for (i = 0; i < l; i++) {
          node = nodes[i];
          currentOverNodes[node.id] = node;
          if (!overNodes[node.id]) {
            newOverNodes.push(node);
            overNodes[node.id] = node;
          }
        }

        // Check no more overred nodes:
        Object.keys(overNodes).forEach(k => {
          if (!currentOverNodes[k]) {
            newOutNodes.push(overNodes[k]);
            delete overNodes[k];
          }
        });

        // Dispatch both single and multi events:
        for (i = 0, l = newOverNodes.length; i < l; i++)
          self.dispatchEvent("overNode", {
            node: newOverNodes[i],
            captor: e.data
          });
        for (i = 0, l = newOutNodes.length; i < l; i++)
          self.dispatchEvent("outNode", {
            node: newOutNodes[i],
            captor: e.data
          });
        if (newOverNodes.length)
          self.dispatchEvent("overNodes", {
            nodes: newOverNodes,
            captor: e.data
          });
        if (newOutNodes.length)
          self.dispatchEvent("outNodes", {
            nodes: newOutNodes,
            captor: e.data
          });

        // Check newly overred edges:
        for (i = 0; i < le; i++) {
          edge = edges[i];
          currentOverEdges[edge.id] = edge;
          if (!overEdges[edge.id]) {
            newOverEdges.push(edge);
            overEdges[edge.id] = edge;
          }
        }

        // Check no more overred edges:
        Object.keys(overEdges).forEach(k => {
          if (!currentOverEdges[k]) {
            newOutEdges.push(overEdges[k]);
            delete overEdges[k];
          }
        });

        // Dispatch both single and multi events:
        for (i = 0, le = newOverEdges.length; i < le; i++)
          self.dispatchEvent("overEdge", {
            edge: newOverEdges[i],
            captor: e.data
          });
        for (i = 0, le = newOutEdges.length; i < le; i++)
          self.dispatchEvent("outEdge", {
            edge: newOutEdges[i],
            captor: e.data
          });
        if (newOverEdges.length)
          self.dispatchEvent("overEdges", {
            edges: newOverEdges,
            captor: e.data
          });
        if (newOutEdges.length)
          self.dispatchEvent("outEdges", {
            edges: newOutEdges,
            captor: e.data
          });
      }

      // Bind events:
      captor.bind("click", onClick);
      captor.bind("mousedown", onMove);
      captor.bind("mouseup", onMove);
      captor.bind("mousemove", onMove);
      captor.bind("mouseout", onOut);
      captor.bind("doubleclick", onDoubleClick);
      captor.bind("rightclick", onRightClick);
      self.bind("render", onMove);
    }

    this.captors.forEach((c: any) => bindCaptor(c));
  }

  sigma.register("sigma.misc.bindEvents", bindEvents);
}

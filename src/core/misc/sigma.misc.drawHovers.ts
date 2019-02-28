import {
  Event,
  Node,
  Edge,
  SigmaLibrary,
  Renderer,
  Keyed
} from "../interfaces";

export default function configure(sigma: SigmaLibrary) {
  /**
   * This method listens to "overNode", "outNode", "overEdge" and "outEdge"
   * events from a renderer and renders the nodes differently on the top layer.
   * The goal is to make any node label readable with the mouse, and to
   * highlight hovered nodes and edges.
   */
  function drawHovers(this: Renderer, prefix: string) {
    //TODO: this type should be renderer
    const hoveredNodes: Keyed<Node> = {};
    const hoveredEdges: Keyed<Edge> = {};

    const draw = () => {
      let hoveredNode;
      let hoveredEdge;
      const c = this.contexts.hover.canvas;
      const defaultNodeType = this.settings("defaultNodeType");
      const defaultEdgeType = this.settings("defaultEdgeType");
      const nodeRenderers = sigma.canvas.hovers;
      const edgeRenderers = sigma.canvas.edgehovers;
      const extremitiesRenderers = sigma.canvas.extremities;
      const embedSettings = this.settings.embedObjects({ prefix });
      const hoverContext = this.contexts.hover! as CanvasRenderingContext2D;

      // Clear this.contexts.hover:
      hoverContext.clearRect(0, 0, c.width, c.height);

      // Node render: single hover
      if (
        embedSettings("enableHovering") &&
        embedSettings("singleHover") &&
        Object.keys(hoveredNodes).length
      ) {
        hoveredNode = hoveredNodes[Object.keys(hoveredNodes)[0]];
        (nodeRenderers[hoveredNode.type] ||
          nodeRenderers[defaultNodeType] ||
          nodeRenderers.def)(hoveredNode, hoverContext, embedSettings);
      }

      // Node render: multiple hover
      if (embedSettings("enableHovering") && !embedSettings("singleHover"))
        Object.keys(hoveredNodes).forEach(k => {
          (nodeRenderers[hoveredNodes[k].type] ||
            nodeRenderers[defaultNodeType] ||
            nodeRenderers.def)(hoveredNodes[k], hoverContext, embedSettings);
        });

      // Edge render: single hover
      if (
        embedSettings("enableEdgeHovering") &&
        embedSettings("singleHover") &&
        Object.keys(hoveredEdges).length
      ) {
        hoveredEdge = hoveredEdges[Object.keys(hoveredEdges)[0]];
        const [source, target] = this.graph.nodes(
          hoveredEdge.source,
          hoveredEdge.target
        );

        if (!hoveredEdge.hidden) {
          (edgeRenderers[hoveredEdge.type] ||
            edgeRenderers[defaultEdgeType] ||
            edgeRenderers.def)(
            hoveredEdge,
            source,
            target,
            hoverContext,
            embedSettings
          );

          if (embedSettings("edgeHoverExtremities")) {
            (extremitiesRenderers[hoveredEdge.type] ||
              extremitiesRenderers.def)(
              hoveredEdge,
              source,
              target,
              hoverContext,
              embedSettings
            );
          } else {
            // Avoid edges rendered over nodes:
            (sigma.canvas.nodes[source.type] || sigma.canvas.nodes.def)(
              source,
              hoverContext,
              embedSettings
            );
            (sigma.canvas.nodes[target.type] || sigma.canvas.nodes.def)(
              target,
              hoverContext,
              embedSettings
            );
          }
        }
      }

      // Edge render: multiple hover
      if (
        embedSettings("enableEdgeHovering") &&
        !embedSettings("singleHover")
      ) {
        Object.keys(hoveredEdges).forEach(k => {
          hoveredEdge = hoveredEdges[k];
          const [source, target] = this.graph.nodes(
            hoveredEdge.source,
            hoveredEdge.target
          );

          if (!hoveredEdge.hidden) {
            (edgeRenderers[hoveredEdge.type] ||
              edgeRenderers[defaultEdgeType] ||
              edgeRenderers.def)(
              hoveredEdge,
              source,
              target,
              hoverContext,
              embedSettings
            );

            if (embedSettings("edgeHoverExtremities")) {
              (extremitiesRenderers[hoveredEdge.type] ||
                extremitiesRenderers.def)(
                hoveredEdge,
                source,
                target,
                hoverContext,
                embedSettings
              );
            } else {
              // Avoid edges rendered over nodes:
              (sigma.canvas.nodes[source.type] || sigma.canvas.nodes.def)(
                source,
                hoverContext,
                embedSettings
              );
              (sigma.canvas.nodes[target.type] || sigma.canvas.nodes.def)(
                target,
                hoverContext,
                embedSettings
              );
            }
          }
        });
      }
    };

    this.bind("overNode", (event: Event<{ node: Node }>) => {
      const { node } = event.data;
      if (!node.hidden) {
        hoveredNodes[node.id] = node;
        draw();
      }
    });

    this.bind("outNode", (event: Event<{ node: Node }>) => {
      delete hoveredNodes[event.data.node.id];
      draw();
    });

    this.bind("overEdge", (event: Event<{ edge: Edge }>) => {
      const { edge } = event.data;
      if (!edge.hidden) {
        hoveredEdges[edge.id] = edge;
        draw();
      }
    });

    this.bind("outEdge", (event: Event<{ edge: Edge }>) => {
      delete hoveredEdges[event.data.edge.id];
      draw();
    });

    this.bind("render", () => draw());
  }

  sigma.register("sigma.misc.drawHovers", drawHovers);
}

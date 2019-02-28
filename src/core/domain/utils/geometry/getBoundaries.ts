import Graph from "../../classes/Graph";

export default function getBoundaries(
  graph: Graph,
  prefix: string,
  doEdges?: boolean
) {
  const edges = graph.edges();
  const nodes = graph.nodes();
  let weightMax = -Infinity;
  let sizeMax = -Infinity;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (doEdges) {
    edges.forEach(edge => {
      weightMax = Math.max((edge as any)[`${prefix}size`], weightMax);
    });
  }

  nodes.forEach(node => {
    sizeMax = Math.max((node as any)[`${prefix}size`], sizeMax);
    maxX = Math.max((node as any)[`${prefix}x`], maxX);
    minX = Math.min((node as any)[`${prefix}x`], minX);
    maxY = Math.max((node as any)[`${prefix}y`], maxY);
    minY = Math.min((node as any)[`${prefix}y`], minY);
  });

  weightMax = weightMax || 1;
  sizeMax = sizeMax || 1;

  return {
    weightMax,
    sizeMax,
    minX,
    minY,
    maxX,
    maxY
  };
}

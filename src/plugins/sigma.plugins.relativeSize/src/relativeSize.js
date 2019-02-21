/**
 * This function will change size for all nodes depending to their degree
 *
 * @param  {sigma}   s       		The related sigma instance.
 * @param  {object}  initialSize 	Start size property
 */
export default function relativeSize(s, initialSize) {
  const nodes = s.graph.nodes();

  // second create size for every node
  for (let i = 0; i < nodes.length; i++) {
    const degree = s.graph.degree(nodes[i].id);
    nodes[i].size = initialSize * Math.sqrt(degree);
  }
  s.refresh();
}

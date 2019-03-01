import Sigma from "../classes/Sigma";

/**
 * This middleware will just copy the graphic properties.
 *
 * @param {?string} readPrefix  The read prefix.
 * @param {?string} writePrefix The write prefix.
 */
export default function copy(
  this: Sigma,
  readPrefix: string,
  writePrefix: string
) {
  if (`${writePrefix}` === `${readPrefix}`) return;

  this.graph.nodes().forEach(node => {
    node[`${writePrefix}x`] = node[`${readPrefix}x`];
    node[`${writePrefix}y`] = node[`${readPrefix}y`];
    node[`${writePrefix}size`] = node[`${readPrefix}size`];
  });

  this.graph.edges().forEach(edge => {
    edge[`${writePrefix}size`] = edge[`${readPrefix}size`];
  });
}

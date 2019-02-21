/* eslint-disable no-constant-condition, no-loop-func */
/**
 * This plugin computes HITS statistics (Authority and Hub measures) for each node of the graph.
 * It adds to the graph model a method called "HITS".
 *
 * Author: Mehdi El Fadil, Mango Information Systems
 * License: This plugin for sigma.js follows the same licensing terms as sigma.js library.
 *
 * This implementation is based on the original paper J. Kleinberg, Authoritative Sources in a Hyperlinked Environment (http://www.cs.cornell.edu/home/kleinber/auth.pdf), and is inspired by implementation in Gephi software (Patick J. McSweeney <pjmcswee@syr.edu>, Sebastien Heymann <seb@gephi.org>, Dual-licensed under GPL v3 and CDDL)
 * https://github.com/Mango-information-systems/gephi/blob/fix-hits/modules/StatisticsPlugin/src/main/java/org/gephi/statistics/plugin/Hits.java
 *
 * Bugs in Gephi implementation should not be found in this implementation.
 * Tests have been put in place based on a test plan used to test implementation in Gephi, cf. discussion here: https://github.com/jacomyal/sigma.js/issues/309
 * No guarantee is provided regarding the correctness of the calculations. Plugin author did not control the validity of the test scenarii.
 *
 * Warning: tricky edge-case. Hubs and authorities for nodes without any edge are only reliable in an undirected graph calculation mode.
 *
 * Check the code for more information.
 *
 * Here is how to use it:
 *
 * > // directed graph
 * > var stats = s.graph.HITS()
 * > // returns an object indexed by node Id with the authority and hub measures
 * > // like { "n0": {"authority": 0.00343, "hub": 0.023975}, "n1": [...]*
 *
 * > // undirected graph: pass 'true' as function parameter
 * > var stats = s.graph.HITS(true)
 * > // returns an object indexed by node Id with the authority and hub measures
 * > // like { "n0": {"authority": 0.00343, "hub": 0.023975}, "n1": [...]
 */

export default function extend(sigma) {
  /**
   * This method takes a graph instance and returns authority and hub measures computed for each node. It uses the built-in
   * indexes from sigma's graph model to search in the graph.
   *
   * @param {boolean} isUndirected flag informing whether the graph is directed or not. Default false: directed graph.
   * @return {object} object indexed by node Ids, containing authority and hub measures for each node of the graph.
   */

  sigma.classes.graph.addMethod("HITS", function HITS(isUndirected) {
    let res = {};
    const epsilon = 0.0001;
    const hubList = [];
    const authList = [];
    const nodes = this.nodes();
    let tempRes = {};

    if (!isUndirected) isUndirected = false;

    nodes.forEach(node => {
      if (isUndirected) {
        hubList.push(node);
        authList.push(node);
      } else {
        if (this.degree(node.id, "out") > 0) hubList.push(node);

        if (this.degree(node.id, "in") > 0) authList.push(node);
      }

      res[node.id] = { authority: 1, hub: 1 };
    });

    let done;

    while (true) {
      done = true;
      let authSum = 0;
      let hubSum = 0;

      authList.forEach(auth => {
        tempRes[auth.id] = { authority: 1, hub: 0 };

        const connectedNodes = isUndirected
          ? this.allNeighborsIndex[auth.id]
          : this.inNeighborsIndex[auth.id];

        Object.keys(connectedNodes)
          .filter(j => j !== auth.id)
          .forEach(j => {
            tempRes[auth.id].authority += res[j].hub;
          });

        authSum += tempRes[auth.id].authority;
      });

      hubList.forEach(hub => {
        if (tempRes[hub.id]) tempRes[hub.id].hub = 1;
        else tempRes[hub.id] = { authority: 0, hub: 1 };

        const connectedNodes = isUndirected
          ? this.allNeighborsIndex[hub.id]
          : this.outNeighborsIndex[hub.id];

        Object.keys(connectedNodes)
          .filter(j => j !== hub.id)
          .forEach(j => {
            tempRes[hub.id].hub += res[j].authority;
          });

        hubSum += tempRes[hub.id].hub;
      });

      authList.forEach(auth => {
        tempRes[auth.id].authority /= authSum;
        if (
          Math.abs(
            (tempRes[auth.id].authority - res[auth.id].authority) /
              res[auth.id].authority
          ) >= epsilon
        )
          done = false;
      });

      hubList.forEach(hub => {
        tempRes[hub.id].hub /= hubSum;
        if (
          Math.abs((tempRes[hub.id].hub - res[hub.id].hub) / res[hub.id].hub) >=
          epsilon
        )
          done = false;
      });
      res = tempRes;

      tempRes = {};

      if (done) break;
    }

    return res;
  });
}

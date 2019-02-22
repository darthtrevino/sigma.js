/* eslint-disable no-eval */
import Worker from "./workerScript";
import crush from "./crush";

export default function extend(sigma, global = window) {
  /**
   * Sigma ForceAtlas2.5 Webworker
   * ==============================
   *
   * Author: Guillaume Plique (Yomguithereal)
   * Algorithm author: Mathieu Jacomy @ Sciences Po Medialab & WebAtlas
   * Version: 1.0.3
   */

  const inWebWorker = !("document" in global);

  // Exporting
  function getWorkerFn() {
    const fnString = crush ? crush(Worker.toString()) : Worker.toString();
    return `;(${fnString}).call(this);`;
  }

  if (inWebWorker) {
    // We are in a webworker, so we launch the Worker function
    eval(getWorkerFn());
  } else {
    sigma.prototype.getForceAtlas2Worker = getWorkerFn;
  }
}

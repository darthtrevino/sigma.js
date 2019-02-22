import { SigmaLibrary } from "../../../interfaces";

/**
 * Simulates a "double click" event.
 *
 * @param  {HTMLElement} target   The event target.
 * @param  {string}      type     The event type.
 * @param  {function}    callback The callback to execute.
 */
export default (sigma: SigmaLibrary) =>
  function doubleClick(target: HTMLElement, type: string, callback) {
    let clicks = 0;
    (target as any)._doubleClickHandler =
      (target as any)._doubleClickHandler || {};
    (target as any)._doubleClickHandler[type] =
      (target as any)._doubleClickHandler[type] || [];
    const handlers = (target as any)._doubleClickHandler[type];

    handlers.push(e => {
      clicks++;
      if (clicks === 2) {
        clicks = 0;
        callback(e);
      } else if (clicks === 1) {
        setTimeout(() => {
          clicks = 0;
        }, (sigma.settings as any).doubleClickTimeout);
      }
    });

    target.addEventListener(type, handlers[handlers.length - 1], false);
  };

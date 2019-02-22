/**
 * Unbind simulated "double click" events.
 *
 * @param  {HTMLElement} target   The event target.
 * @param  {string}      type     The event type.
 */
export default function unbindDoubleClick(target: HTMLElement, type: string) {
  const handlers = ((target as any)._doubleClickHandler || {})[type] || [];
  let handler = handlers.pop();
  while (handler) {
    target.removeEventListener(type, handler);
    handler = handlers.pop();
  }

  delete ((target as any)._doubleClickHandler || {})[type];
}

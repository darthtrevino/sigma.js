/**
 * SVG Element show.
 *
 * @param  {DOMElement}               element   The DOM element to show.
 */
export function show(element: HTMLElement) {
  element.style.display = "";
  return this;
}

/**
 * SVG Element hide.
 *
 * @param  {DOMElement}               element   The DOM element to hide.
 */
export function hide(element: HTMLElement) {
  element.style.display = "none";
  return this;
}

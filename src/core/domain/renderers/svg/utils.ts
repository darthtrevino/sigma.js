export function show(element: HTMLElement) {
  element.style.display = "";
  return this;
}

export function hide(element: HTMLElement) {
  element.style.display = "none";
  return this;
}

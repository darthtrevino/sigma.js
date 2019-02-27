export default function getOffset(dom: HTMLElement) {
  let left = 0;
  let top = 0;

  while (dom) {
    top += dom.offsetTop;
    left += dom.offsetLeft;
    dom = (dom as any).offsetParent;
  }

  return {
    top,
    left
  };
}

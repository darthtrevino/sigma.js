export default function getPixelRatio() {
  let ratio = 1;
  const screen = window.screen as any;
  if (
    screen.deviceXDPI !== undefined &&
    screen.logicalXDPI !== undefined &&
    screen.deviceXDPI > screen.logicalXDPI
  ) {
    ratio = screen.systemXDPI / screen.logicalXDPI;
  } else if (window.devicePixelRatio !== undefined) {
    ratio = window.devicePixelRatio;
  }
  return ratio;
}

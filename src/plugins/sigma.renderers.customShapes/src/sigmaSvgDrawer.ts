export default drawSVGImage => ({
  create(node, settings) {
    const group = document.createElementNS(settings("xmlns"), "g");
    const circle = document.createElementNS(settings("xmlns"), "circle");

    group.setAttributeNS(
      null,
      "class",
      `${settings("classPrefix")}-node-group`
    );
    group.setAttributeNS(null, "data-node-id", node.id);
    // Defining the node's circle
    circle.setAttributeNS(null, "data-node-id", node.id);
    circle.setAttributeNS(null, "class", `${settings("classPrefix")}-node`);
    circle.setAttributeNS(
      null,
      "fill",
      node.color || settings("defaultNodeColor")
    );

    group.appendChild(circle);
    drawSVGImage(node, group, settings);
    return group;
  },
  update(node, group, settings) {
    const classPrefix = settings("classPrefix");
    const clip = node.image.clip || 1;
    // 1 is arbitrary, anyway only the ratio counts
    const ih = node.image.h || 1;
    const iw = node.image.w || 1;
    const prefix = settings("prefix") || "";
    const scale = node.image.scale || 1;
    const size = node[`${prefix}size`];
    const x = node[`${prefix}x`];
    const y = node[`${prefix}y`];
    const r = scale * size;
    const xratio = iw < ih ? iw / ih : 1;
    const yratio = ih < iw ? ih / iw : 1;

    const { childNodes } = group;
    for (let i = 0; i < childNodes.length; i++) {
      const className = childNodes[i].getAttribute("class");

      switch (className) {
        case `${classPrefix}-node`:
          childNodes[i].setAttributeNS(null, "cx", x);
          childNodes[i].setAttributeNS(null, "cy", y);
          childNodes[i].setAttributeNS(null, "r", size);

          // // Updating only if not freestyle
          if (!settings("freeStyle")) {
            childNodes[i].setAttributeNS(
              null,
              "fill",
              node.color || settings("defaultNodeColor")
            );
          }
          break;
        case `${classPrefix}-node-image`:
          childNodes[i].setAttributeNS(
            null,
            "x",
            x + Math.sin(-3.142 / 4) * r * xratio
          );
          childNodes[i].setAttributeNS(
            null,
            "y",
            y - Math.cos(-3.142 / 4) * r * yratio
          );
          childNodes[i].setAttributeNS(
            null,
            "width",
            r * xratio * 2 * Math.sin(-3.142 / 4) * -1
          );
          childNodes[i].setAttributeNS(
            null,
            "height",
            r * yratio * 2 * Math.cos(-3.142 / 4)
          );
          break;
        default: {
          // no class name, must be the clip-path
          const clipPath = childNodes[i].firstChild;
          if (clipPath != null) {
            const clipPathId = `${classPrefix}-clip-path-${node.id}`;
            if (clipPath.getAttribute("id") === clipPathId) {
              clipPath.firstChild.setAttributeNS(null, "cx", x);
              clipPath.firstChild.setAttributeNS(null, "cy", y);
              clipPath.firstChild.setAttributeNS(null, "r", clip * size);
            }
          }
          break;
        }
      }
    }

    // showing
    group.style.display = "";
  }
});

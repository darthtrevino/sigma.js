# sigma.renderers.edgeDots

Plugin developed by [Joakim af Sandeberg](https://github.com/jotunacorn).

Contact: joakim.afs+github@gmail.com

---

## General

This plugin adds the option to show colored dots near the source and target of an edge when using the canvas renderer.

See the following [example](../../examples/plugin-edgeDots.html) for full usage.

To use it, include all .js files under this folder.

## Edges

This plugin extends Sigma.js canvas edges:

- **sourceDotColor**
  - The value to use as color for the source dot. If left undefined there will be no dot at the source.
  - type: _string_
  - default value: undefined
- **targetDotColor**
  - The value to use as color for the target dot. If left undefined there will be no dot at the target.
  - type: _string_
  - default value: undefined
- **dotOffset**
  - The value which define the distance between the dots and the nodes, relative to the node size.
  - type: _number_
  - default value: 3
- **dotSize**
  - The value which define the size of the dot relative to the edge.
  - type: _number_
  - default value: 1

## Renderers

This plugin modifies the sigma.canvas.edges.curve and sigma.canvas.edges.curvedArrow.
To switch to the edgeDot variant, invoke `sigma.canvas.edges.useDotCurves()` prior to creating the sigma instance.

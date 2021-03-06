import Camera from "../Camera";
import Graph from "../Graph";
import Configurable from "../Configurable";
import settings from "../../default_settings";

describe("The Camera class", () => {
  it("Basic manipulation", () => {
    const graph = new Graph();
    const camera = new Camera("myCam", graph, Configurable(settings));

    expect([camera.x, camera.y, camera.ratio, camera.angle]).toEqual([
      0,
      0,
      1,
      0
    ]);

    camera.goTo({
      x: 1,
      y: 2,
      ratio: 3,
      angle: 4
    });
    expect([camera.x, camera.y, camera.ratio, camera.angle]).toEqual([
      1,
      2,
      3,
      4
    ]);

    camera.goTo({
      x: 5
    });
    expect([camera.x, camera.y, camera.ratio, camera.angle]).toEqual([
      5,
      2,
      3,
      4
    ]);

    expect(() => camera.goTo({ x: "abc" } as any)).toThrow(
      /Value for "x" is not a number./
    );

    expect(() => camera.goTo({ x: NaN })).toThrow(
      /Value for "x" is not a number./
    );
  });

  it("Apply to a graph", () => {
    function approx(v) {
      return Math.round(v * 10000) / 10000;
    }

    const graph = new Graph();
    const camera = new Camera("myCam", graph, Configurable(settings));

    // Fill the graph:
    graph
      .addNode({
        id: "0",
        x: 1,
        y: 2,
        size: 1
      })
      .addNode({
        id: "1",
        x: 2,
        y: 1,
        size: 1
      })
      .addNode({
        id: "2",
        x: 1,
        y: 0,
        size: 1
      });

    graph.addEdge({
      id: "0",
      source: "0",
      target: "1",
      size: 1
    });

    camera.applyView("", "display:");
    expect(
      graph.nodes().map(n => {
        return {
          x: n["display:x"],
          y: n["display:y"],
          size: n["display:size"]
        };
      })
    ).toEqual(
      graph.nodes().map(n => {
        return {
          x: n.x,
          y: n.y,
          size: n.size
        };
      })
    );

    camera.goTo({
      x: 2,
      y: 1,
      ratio: 2,
      angle: Math.PI / 2
    });
    camera.applyView("", "display:");
    expect(
      graph.nodes().map(n => {
        return {
          x: approx(n["display:x"]),
          y: approx(n["display:y"]),
          size: approx(n["display:size"])
        };
      })
    ).toEqual([
      {
        x: 0.5,
        y: 0.5,
        size: approx(0.5 ** camera.settings("nodesPowRatio"))
      },
      {
        x: 0,
        y: 0,
        size: approx(0.5 ** camera.settings("nodesPowRatio"))
      },
      {
        x: -0.5,
        y: 0.5,
        size: approx(0.5 ** camera.settings("nodesPowRatio"))
      }
    ]);
  });

  it("Position", () => {
    function approx(v) {
      return Math.round(v * 10000) / 10000;
    }

    let pos;

    const camera = new Camera("myCam", undefined, Configurable(settings));

    camera.goTo({
      x: 2,
      y: 1,
      ratio: 2,
      angle: Math.PI / 2
    });
    pos = camera.graphPosition(1, 2);
    expect({ x: approx(pos.x), y: approx(pos.y) }).toEqual({ x: 0.5, y: 0.5 });

    camera.goTo({
      x: 0,
      y: 2,
      ratio: 0.5,
      angle: -Math.PI / 2
    });
    pos = camera.graphPosition(1, 2);
    expect({ x: approx(pos.x), y: approx(pos.y) }).toEqual({ x: 0, y: 2 });

    camera.goTo({
      x: 2,
      y: 1,
      ratio: 2,
      angle: Math.PI / 2
    });
    pos = camera.cameraPosition(0.5, 0.5);
    expect({ x: approx(pos.x), y: approx(pos.y) }).toEqual({ x: 1, y: 2 });

    camera.goTo({
      x: 0,
      y: 2,
      ratio: 0.5,
      angle: -Math.PI / 2
    });
    pos = camera.cameraPosition(0, 2);
    expect({ x: approx(pos.x), y: approx(pos.y) }).toEqual({ x: 1, y: 2 });
  });
});

import sigma from "../index";

describe("Animation", () => {
  it("Camera animation", done => {
    function approx(v) {
      return Math.round(v * 10000) / 10000;
    }

    let hasTestedFrame;

    const graph = new sigma.classes.graph();
    const camera = new sigma.classes.camera(
      "myCam",
      graph,
      sigma.classes.configurable(sigma.settings)
    );

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
    sigma.misc.animation.camera(
      camera,
      {
        x: 2,
        y: 1,
        ratio: 2,
        angle: Math.PI / 2
      },
      {
        duration: 50,
        easing: k => (k === 1 ? k : 0.5),
        onNewFrame() {
          camera.applyView("", "display:");

          if (!hasTestedFrame) {
            expect(
              graph.nodes().map(n => ({
                x: approx(n["display:x"]),
                y: approx(n["display:y"]),
                size: approx(n["display:size"])
              }))
            ).toEqual(
              [
                {
                  size: approx((2 / 3) ** camera.settings("nodesPowRatio")),
                  x: approx(Math.SQRT1_2),
                  y: approx(Math.SQRT1_2)
                },
                {
                  size: approx((2 / 3) ** camera.settings("nodesPowRatio")),
                  x: approx(Math.SQRT1_2),
                  y: -approx(Math.SQRT1_2) / 3
                },
                {
                  size: approx((2 / 3) ** camera.settings("nodesPowRatio")),
                  x: -approx(Math.SQRT1_2) / 3,
                  y: -approx(Math.SQRT1_2) / 3
                }
              ],
              "Animation's middle gives the good values."
            );
            hasTestedFrame = true;
          }
        },
        onComplete() {
          camera.applyView("", "display:");
          expect(
            graph.nodes().map(n => ({
              x: approx(n["display:x"]),
              y: approx(n["display:y"]),
              size: approx(n["display:size"])
            }))
          ).toEqual(
            [
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
            ],
            "Animation's end gives the good values and custom easings work well."
          );
          done();
        }
      }
    );
  });
});

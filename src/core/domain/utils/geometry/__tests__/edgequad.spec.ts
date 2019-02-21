import lowerLeftCoor from "../lowerLeftCoor";
import lowerRightCoor from "../lowerRightCoor";
import isAxisAligned from "../isAxisAligned";
import axisAlignedTopPoints from "../axisAlignedTopPoints";
import collision from "../collision";
import pointToSquare from "../pointToSquare";
import projection from "../projection";
import rectangleCorners from "../rectangleCorners";
import splitSquare from "../splitSquare";

describe("edge quad utilities", () => {
  // Test Beginning
  //= ===============
  it("works", () => {
    // Helpers
    //---------
    function approx(v) {
      return Math.round(v * 10000) / 10000;
    }

    // Geometry
    //----------
    const rectangles = [
      { x1: 1, y1: 2, x2: 2, y2: 1, height: Math.sqrt(2) },
      { x1: 3, y1: 4, x2: 4, y2: 3, height: Math.sqrt(2) },
      { x1: 2, y1: 2, x2: 4, y2: 2, height: 1 },
      { x1: 10, y1: 10, x2: 12, y2: 10, height: 2 },
      { x1: 2, y1: 6, x2: 6, y2: 6, height: 4 }
    ];

    const llc = lowerLeftCoor(rectangles[0]);

    expect(isAxisAligned(rectangles[0])).toBeFalsy();
    expect(isAxisAligned(rectangles[2])).toBeTruthy();

    const topCorners = { x1: 2, y1: 2, x2: 4, y2: 2, height: 2 };
    expect(
      axisAlignedTopPoints({ x1: 2, y1: 2, x2: 4, y2: 2, height: 2 })
    ).toEqual(topCorners);

    expect(
      axisAlignedTopPoints({ x1: 4, y1: 2, x2: 4, y2: 4, height: 2 })
    ).toEqual(topCorners);

    expect(
      axisAlignedTopPoints({ x1: 2, y1: 4, x2: 2, y2: 2, height: 2 })
    ).toEqual(topCorners);

    expect(
      axisAlignedTopPoints({ x1: 4, y1: 4, x2: 2, y2: 4, height: 2 })
    ).toEqual(topCorners);

    expect(llc).toEqual({ x: 2, y: 3 });

    expect(lowerRightCoor(rectangles[0], llc)).toEqual({ x: 3, y: 2 });

    const p = projection({ x: 2, y: 6 }, { x: 3, y: 4 });
    expect({ x: approx(p.x), y: approx(p.y) }).toEqual({ x: 3.6, y: 4.8 });

    const solutions = [
      [{ x: 1, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 2 }],
      [{ x: 3, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 5 }, { x: 5, y: 4 }],
      [{ x: 2, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 3 }, { x: 4, y: 3 }],
      [{ x: 10, y: 10 }, { x: 12, y: 10 }, { x: 10, y: 12 }, { x: 12, y: 12 }],
      [{ x: 2, y: 6 }, { x: 6, y: 6 }, { x: 2, y: 10 }, { x: 6, y: 10 }],
      [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 6 }]
    ];

    expect(pointToSquare({ x: 4, y: 4, size: 2 })).toEqual({
      x1: 2,
      y1: 2,
      x2: 6,
      y2: 2,
      height: 4
    });

    rectangles.forEach((r, i) => {
      expect(rectangleCorners(r)).toEqual(solutions[i]);
    });

    const cr = [
      rectangleCorners({
        x1: 4,
        y1: 6,
        x2: 6,
        y2: 4,
        height: Math.sqrt(8)
      }),
      rectangleCorners({
        x1: 4,
        y1: 8,
        x2: 6,
        y2: 6,
        height: Math.sqrt(8)
      }),
      rectangleCorners({ x1: 10, y1: 10, x2: 12, y2: 10, height: 2 }),
      rectangleCorners({ x1: 0, y1: 0, x2: 200, y2: 200, height: 200 }),
      rectangleCorners({ x1: 200, y1: 200, x2: 400, y2: 400, height: 200 })
    ];

    expect(collision(cr[0], cr[1])).toBeTruthy();
    expect(collision(cr[0], cr[2])).toBeFalsy();
    expect(collision(cr[0], cr[3])).toBeTruthy();
    expect(collision(cr[0], cr[4])).toBeFalsy();

    expect(splitSquare({ x: 0, y: 0, width: 100, height: 100 })).toEqual([
      [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 0, y: 50 }, { x: 50, y: 50 }],
      [{ x: 50, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 50 }],
      [{ x: 0, y: 50 }, { x: 50, y: 50 }, { x: 0, y: 100 }, { x: 50, y: 100 }],
      [
        { x: 50, y: 50 },
        { x: 100, y: 50 },
        { x: 50, y: 100 },
        { x: 100, y: 100 }
      ]
    ]);
  });
});

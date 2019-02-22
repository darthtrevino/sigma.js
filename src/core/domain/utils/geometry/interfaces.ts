export interface Point {
  x: number;
  y: number;
}

export interface Line {
  y1: number;
  y2: number;
  x1: number;
  x2: number;
}

export interface Boundaries {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Rectangle extends Line {
  height: number;
}

export type RectangleCorners = [Point, Point, Point, Point];

export interface Edge extends Line {
  size: number;
}
export interface Node extends Point {
  size: number;
}

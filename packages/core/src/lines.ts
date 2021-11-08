/* Copyright (C) 2019 Ghent University - All Rights Reserved */
// CONSTANTS
const threshold = 0.01;

export interface Position {
  x: number;
  y: number;
}

// Calculates the squared distance between two points
export function distSq(p1: Position, p2: Position): number {
  return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

export interface Line {
  start: Position;
  end: Position;
}

export function dist(line: Line): number {
  return Math.sqrt(distSq(line.start, line.end));
}

// Checks if two numbers d1 and d2 are almost equal. (The difference has to be smaller than a certain threshold)
export function isEqual(d1: number, d2: number): boolean {
  return d1 - d2 < threshold && d1 - d2 > -threshold;
}

// Removed duplicate points from an array of points by checking if the position in the list is equal to the position
// of the first occurrence of the point.
export function removeDuplicates(myArray: Position[]): Position[] {
  return myArray.filter(
    (obj, index, self) =>
      index === self.findIndex((t) => isEqual(t.x, obj.x) && isEqual(t.y, obj.y)),
  );
}

// If d1 and d2 are the same, then following conditions must met to form a square.
// 1) Square of d3 is same as twice the square of d1
// 2) Square of d2 is same as twice the square of d1
export function squareTest(
  d1: number,
  d2: number,
  d3: number,
  p1: Position,
  p2: Position,
  p3: Position,
): boolean {
  if (isEqual(d1, d2) && isEqual(2 * d1, d3) && isEqual(2 * d1, distSq(p1, p2))) {
    const d = distSq(p1, p3);
    return isEqual(d, distSq(p2, p3)) && isEqual(d, d1);
  }
  return false;
}

function toFixed(num: number): string {
  const fixed = num.toFixed(4);
  if (fixed === '-0.0000') {
    return '0.0000';
  } else {
    return fixed;
  }
}

// EXPORTED FUNCTIONS

// Function that takes an array of line segments and merges the overlapping segments.
// It returns an array with the merged lines.
export function mergeLines(lines: Line[]): Line[] {
  const ricoDict: Record<string, Record<string, Line[]>> = {};
  const vertDict: Record<string, Line[]> = {};

  // sort op rico and on intersection with the y-axis:
  // This groups line segments on the same line together.

  for (let i = 0; i < lines.length; i++) {
    const p1 = lines[i].start;
    const p2 = lines[i].end;
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;
    if (x1 === x2) {
      if (x1 in vertDict) {
        vertDict[x1].push(lines[i]);
      } else {
        vertDict[x1] = [lines[i]];
      }
    } else {
      let rico: number | string = (y2 - y1) / (x2 - x1);
      const b = toFixed(y1 - rico * x1);
      rico = toFixed(rico);
      if (rico in ricoDict) {
        const lineDict = ricoDict[rico];
        if (b in lineDict) {
          lineDict[b].push(lines[i]);
        } else {
          lineDict[b] = [lines[i]];
        }
        ricoDict[rico] = lineDict;
      } else {
        const lineDict: Record<string, Line[]> = {};
        lineDict[b] = [lines[i]];
        ricoDict[rico] = lineDict;
      }
    }
  }

  // sort rico dictionary on intersection with y-axis.
  const mergedLines = [];

  for (const [_rico, ld] of Object.entries(ricoDict)) {
    for (const [_b, lines] of Object.entries(ld)) {
      let line = lines[0];
      for (let i = 1; i < lines.length; i++) {
        if (distSq(line.start, lines[i].end) > distSq(line.end, lines[i].start)) {
          line = { start: line.start, end: lines[i].end };
        } else {
          line = { start: lines[i].start, end: line.end };
        }
      }
      mergedLines.push(line);
    }
  }

  for (const [_x, lines] of Object.entries(vertDict)) {
    let line = lines[0];
    for (let i = 1; i < lines.length; i++) {
      if (distSq(line.start, lines[i].end) > distSq(line.end, lines[i].start)) {
        line = { start: line.start, end: lines[i].end };
      } else {
        line = { start: lines[i].start, end: line.end };
      }
    }
    mergedLines.push(line);
  }
  return mergedLines;
}

// Given points, test if they form a square
export function pointsAreSquare(points: Position[]): boolean {
  // only square if there are four unique points
  if (points.length === 4) {
    const p1 = points[0];
    const p2 = points[1];
    const p3 = points[2];
    const p4 = points[3];

    const d2 = distSq(p1, p2); // distance squared from p1 to p2
    const d3 = distSq(p1, p3); // distance squared from p1 to p3
    const d4 = distSq(p1, p4); // distance squared from p1 to p4

    // test if the points form a square
    if (squareTest(d2, d3, d4, p2, p3, p4)) return true;
    if (squareTest(d3, d4, d2, p3, p4, p2)) return true;
    if (squareTest(d2, d4, d3, p2, p4, p3)) return true;
  }
  return false;
}

export function findSquareLength(points: Position[]): number {
  let l = 0;
  for (let i = 0; i < 4; i++) {
    const p = points[i];
    for (let j = 0; j < 4; j++) {
      if (i !== j) {
        const q = points[j];
        const d = distSq(p, q);
        if (d < l || l === 0) {
          l = d;
        }
      }
    }
  }
  return Math.sqrt(l);
}

export function findSquares(
  lines: Line[],
): false | { points: Position[]; length: number }[] {
  const squares = [];
  if (lines.length < 4) return false; // no square without at least 4 sides

  const mergedLines = mergeLines(lines);
  //
  // check if four points are a square
  //
  for (let i = 0; i < mergedLines.length - 3; i++) {
    for (let j = i + 1; j < mergedLines.length - 2; j++) {
      for (let k = j + 1; k < mergedLines.length - 1; k++) {
        for (let l = k + 1; l < mergedLines.length; l++) {
          const p11 = mergedLines[i].start;
          const p12 = mergedLines[i].end;
          const p21 = mergedLines[j].start;
          const p22 = mergedLines[j].end;
          const p31 = mergedLines[k].start;
          const p32 = mergedLines[k].end;
          const p41 = mergedLines[l].start;
          const p42 = mergedLines[l].end;
          let points = [p11, p12, p21, p22, p31, p32, p41, p42];

          // from the 8 points, there should be 4 pairs of equal points
          points = removeDuplicates(points);
          const square = { points: points, length: findSquareLength(points) };

          if (pointsAreSquare(points)) {
            squares.push(square);
          }
        }
      }
    }
  }
  return squares;
}

export function pointsAreTriangle(points: Position[]): boolean {
  // given points are not equal
  return points.length === 3;
}

export function findTriangles(lines: Line[]): boolean | Position[][] {
  const triangles = [];
  if (lines.length < 3) return false;
  const mergedLinesList = mergeLines(lines);
  for (let i = 0; i < mergedLinesList.length - 2; i++) {
    for (let j = i + 1; j < mergedLinesList.length - 1; j++) {
      for (let k = j + 1; k < mergedLinesList.length; k++) {
        const p11 = mergedLinesList[i].start;
        const p12 = mergedLinesList[i].end;
        const p21 = mergedLinesList[j].start;
        const p22 = mergedLinesList[j].end;
        const p31 = mergedLinesList[k].start;
        const p32 = mergedLinesList[k].end;
        let points = [p11, p12, p21, p22, p31, p32];

        // from the 6 points, there should be 3 pairs of equal points
        points = removeDuplicates(points);

        if (pointsAreTriangle(points)) triangles.push(points);
      }
    }
  }
  return triangles;
}

export function angle(p1: Position, p2: Position): number {
  const result = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  // if (result <= 180) {
  //   return result;
  // } else {
  //   return 360 - result;
  // }
  return -(result - 90);
}

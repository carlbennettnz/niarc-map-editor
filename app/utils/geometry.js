import Ember from 'ember';

const {
  assign
} = Ember;

export function checkPointCollision(point, target, tolerance) {
  return Math.sqrt(Math.pow(point.x - target.x, 2) + Math.pow(point.y - target.y, 2)) < tolerance;
}

export function checkLineCollision(point, line, tolerance) {
  // Avoid side effects
  line = assign({}, line);

  // Swap values to ensure x1 < x2 and y1 < y2. Makes the collision check simpiler.
  if (line.x1 > line.x2) {
    [ line.x1, line.x2 ] = [ line.x2, line.x1 ];
  }

  if (line.y1 > line.y2) {
    [ line.y1, line.y2 ] = [ line.y2, line.y1 ];
  }

  const lineLength = pythagoras(line);
  const lineEnd1ToPoint = pythagoras(assign({}, line, { x2: point.x, y2: point.y }));
  const lineEnd2ToPoint = pythagoras(assign({}, line, { x1: point.x, y1: point.y }));

  if (lineEnd1ToPoint > lineLength) {
    return lineEnd2ToPoint < tolerance;
  }

  if (lineEnd2ToPoint > lineLength) {
    return lineEnd1ToPoint < tolerance;
  }

  // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
  const areaOfTriangleX2 = Math.abs((line.y2 - line.y1) * point.x - (line.x2 - line.x1) * point.y + line.x2 * line.y1 - line.y2 * line.x1);

  return areaOfTriangleX2 / lineLength < tolerance;
}

export function pythagoras({ x1, y1, x2, y2 }) {
  return Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}

import Ember from 'ember';

const {
  get,
  assign
} = Ember;

export function checkPointCollision(point, target, tolerance) {
  return Math.sqrt(Math.pow(get(point, 'x') - get(target, 'x'), 2) + Math.pow(get(point, 'y') - get(target, 'y'), 2)) < tolerance;
}

export function checkLineCollision(point, line, tolerance) {
  const lineLength = pythagoras(line);
  const lineEnd1ToPoint = pythagoras(assign({}, line, { x2: get(point, 'x'), y2: get(point, 'y') }));
  const lineEnd2ToPoint = pythagoras(assign({}, line, { x1: get(point, 'x'), y1: get(point, 'y') }));

  if (lineEnd1ToPoint > lineLength) {
    return lineEnd2ToPoint < tolerance;
  }

  if (lineEnd2ToPoint > lineLength) {
    return lineEnd1ToPoint < tolerance;
  }

  // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
  const areaOfTriangleX2 = Math.abs((get(line, 'x1') - get(point, 'x')) * (get(line, 'y2') - get(line, 'y1')) - (get(line, 'x1') - get(line, 'x2')) * (get(point, 'y') - get(line, 'y1')));

  return areaOfTriangleX2 / lineLength < tolerance;
}

export function pythagoras({ x1, y1, x2, y2 }) {
  return Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}

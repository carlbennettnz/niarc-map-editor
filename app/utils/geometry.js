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

export function lineIsInRect(rect, line) {
  let {
    x1: rectX1,
    y1: rectY1,
    x2: rectX2,
    y2: rectY2
  } = rect;

  let {
    x1: lineX1,
    y1: lineY1,
    x2: lineX2,
    y2: lineY2
  } = line;

  if (rectX1 > rectX2) {
    [ rectX1, rectX2 ] = [ rectX2, rectX1 ];
  }

  if (rectY1 > rectY2) {
    [ rectY1, rectY2 ] = [ rectY2, rectY1 ];
  }

  if (lineX1 > lineX2) {
    [ lineX1, lineX2 ] = [ lineX2, lineX1 ];
  }

  if (lineY1 > lineY2) {
    [ lineY1, lineY2 ] = [ lineY2, lineY1 ];
  }

  const xAxis = rectX1 < lineX1 && lineX2 < rectX2;
  const yAxis = rectY1 < lineY1 && lineY2 < rectY2;

  console.log(
    rectX1,
    rectY1,
    rectX2,
    rectY2,
    lineX1,
    lineY1,
    lineX2,
    lineY2
  );

  return xAxis && yAxis;
}

export function pythagoras({ x1, y1, x2, y2 }) {
  return Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}

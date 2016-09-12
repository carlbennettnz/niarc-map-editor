import Ember from 'ember';

const {
  get,
  set,
  isEmpty
} = Ember;

export default Ember.Object.extend({
  type: 'go-to-point',
  x: null,
  y: null,
  radius: null,
  isSelected: false,
  dropCube: false,

  serialize() {
    const serialized = [
      get(this, 'radius') > 0 ? 1 : 0, // go to point: 0, go to point curved: 1, drop cube: 2
      Number(get(this, 'x')) || 0,
      Number(get(this, 'y')) || 0,
      Number(get(this, 'pointToFace.x')) || 0,
      Number(get(this, 'pointToFace.y')) || 0,
      Number(get(this, 'rampMinValue')) || 0,
      Number(get(this, 'errorCorrectionP')) || 0,
      Number(get(this, 'pSaturation')) || 0,
      Number(get(this, 'facePointP')) || 0,
      Number(get(this, 'facePointPSaturation')) || 0,
      Number(get(this, 'maxSpeed')) || 0,
      Number(get(this, 'rampDistance')) || 0,
      Number(get(this, 'tolerance')) || 0,
      Number(get(this, 'acceleration')) || 0,
      Number(get(this, 'rampCurveExponent')) || 0,
      get(this, 'stopAtEndOfLine') === true ? 1 : 0,
      Number(get(this, 'face')) || 0, // go to point: 0, go to point curved: 1, drop cube: 2
      Number(get(this, 'radius')) || 0,
      Number(get(this, 'curveErrorCorrectionP')) || 0,
      Number(get(this, 'servoIndex')) || 0
    ].join();

    return serialized;
  },

  deserialize(data) {
    const pointsToFace = [];

    set(this, 'x',                     Number(data[0]));
    set(this, 'y',                     Number(data[1]));
    set(this, 'pointToFace.x',         Number(data[2]));
    set(this, 'pointToFace.y',         Number(data[3]));
    set(this, 'rampMinValue',          Number(data[4]));
    set(this, 'errorCorrectionP',      Number(data[5]));
    set(this, 'pSaturation',           Number(data[6]));
    set(this, 'facePointP',            Number(data[7]));
    set(this, 'facePointPSaturation',  Number(data[8]));
    set(this, 'maxSpeed',              Number(data[9]));
    set(this, 'rampDistance',          Number(data[10]));
    set(this, 'tolerance',             Number(data[11]));
    set(this, 'acceleration',          Number(data[12]));
    set(this, 'rampCurveExponent',     Number(data[13]));
    set(this, 'stopAtEndOfLine',       Number(data[14]) === 1);
    set(this, 'face',                  pointsToFace[Number(data[15])]);
    set(this, 'radius',                Number(data[16]));
    set(this, 'curveErrorCorrectionP', Number(data[17]));
    set(this, 'servoIndex',            Number(data[18]));
  }
});

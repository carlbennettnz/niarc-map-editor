import Ember from 'ember';

const {
  get,
  set,
  isEmpty
} = Ember;

export default Ember.Object.extend({
  id: null,
  type: 'go-to-point',
  x: null,
  y: null,
  radius: 0,

  relativePointX: 0,
  relativePointY: 0,
  pointToFaceX: 0,
  pointToFaceY: 0,
  rampMinValue: 0.15,
  errorCorrectionP: 0.003,
  pSaturation: 0.2,
  facePointP: 0.08,
  facePointPSaturation: 0.2,
  maxSpeed: 0.4,
  rampDistance: 400,
  tolerance: 50,
  acceleration: 0.1,
  rampCurveExponent: 2,
  stopAtEndOfLine: false,
  face: 0,
  angleToFace: 0,
  curveErrorCorrectionP: 0.003,
  servoIndex: 0,
  sensorToUse: 0,
  goToWallPGain: 0,

  serialize() {
    const types = {
      'go-to-point': 1,
      'drop-cube': 2,
      'face-angle': 3,
      'go-to-wall': 4,
      'go-to-point-relative': 5
    };

    const getType = (index, radius) => types[index] === 1 ? Number(radius > 0) : types[index];

    const serialized = [
      getType(get(this, 'type'), get(this, 'radius')),
      Number(get(this, 'x')) || 0,
      Number(get(this, 'y')) || 0,
      Number(get(this, 'relativePointX')) || 0,
      Number(get(this, 'relativePointY')) || 0,
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
      Number(get(this, 'angleToFace')) || 0,
      Number(get(this, 'radius')) || 0,
      Number(get(this, 'curveErrorCorrectionP')) || 0,
      Number(get(this, 'servoIndex')) || 0,
      Number(get(this, 'sensorToUse')) || 0,
      Number(get(this, 'goToWallPGain')) || 0
    ].join();

    return serialized;
  },

  deserialize(data) {
    const pointsToFace = [];

    const types = [
      'go-to-point',
      'go-to-point',
      'drop-cube',
      'face-angle',
      'go-to-wall',
      'go-to-point-relative'
    ];

    set(this, 'type',                  types[Number(data[0])]);
    set(this, 'x',                     Number(data[1]));
    set(this, 'y',                     Number(data[2]));
    set(this, 'relativePoint.x',       Number(data[3]));
    set(this, 'relativePoint.y',       Number(data[4]));
    set(this, 'pointToFace.x',         Number(data[5]));
    set(this, 'pointToFace.y',         Number(data[6]));
    set(this, 'rampMinValue',          Number(data[7]));
    set(this, 'errorCorrectionP',      Number(data[8]));
    set(this, 'pSaturation',           Number(data[9]));
    set(this, 'facePointP',            Number(data[10]));
    set(this, 'facePointPSaturation',  Number(data[11]));
    set(this, 'maxSpeed',              Number(data[12]));
    set(this, 'rampDistance',          Number(data[13]));
    set(this, 'tolerance',             Number(data[14]));
    set(this, 'acceleration',          Number(data[15]));
    set(this, 'rampCurveExponent',     Number(data[16]));
    set(this, 'stopAtEndOfLine',       Number(data[17]) === 1);
    set(this, 'face',                  Number(data[18]));
    set(this, 'angleToFace',           Number(data[19]));
    set(this, 'radius',                Number(data[20]));
    set(this, 'curveErrorCorrectionP', Number(data[21]));
    set(this, 'servoIndex',            Number(data[22]));
    set(this, 'sensorToUse',           Number(data[23]));
    set(this, 'goToWallPGain',         Number(data[24]));
  }
});

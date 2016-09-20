import Ember from 'ember';

const {
  get,
  set,
  isEmpty
} = Ember;

let nextId = 0;

export const eventTypes = [];

eventTypes[0] = 'go-to-point';
eventTypes[1] = 'go-to-point';
eventTypes[2] = 'drop-cube';
eventTypes[3] = 'face-angle';
eventTypes[4] = 'go-to-wall';
eventTypes[5] = 'go-to-point-relative';
eventTypes[6] = 'toggle-localisation';
eventTypes[7] = 'wait';
eventTypes[8] = 'message';

export default Ember.Object.extend({
  init() {
    this._super(...arguments);
    set(this, 'id', nextId);
    nextId++;
  },

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
  enableLocalisation: true,
  timeToWait: 0,
  message: '',

  // ATTENTION: Don't add params without also adding them to the exported
  // parameters array at the end of this file.

  serialize() {
    const getType = (type, radius) => eventTypes.indexOf(type) === 0 ? Number(radius > 0) : eventTypes.indexOf(type);

    const serialized = [
      getType(get(this, 'type'), get(this, 'radius')),
      Number(get(this, 'x')) || 0,
      Number(get(this, 'y')) || 0,
      Number(get(this, 'relativePointX')) || 0,
      Number(get(this, 'relativePointY')) || 0,
      Number(get(this, 'pointToFaceX')) || 0,
      Number(get(this, 'pointToFaceY')) || 0,
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
      Number(get(this, 'angleToFace')) / 180 * Math.PI || 0,
      Number(get(this, 'radius')) || 0,
      Number(get(this, 'curveErrorCorrectionP')) || 0,
      Number(get(this, 'servoIndex')) || 0,
      Number(get(this, 'sensorToUse')) || 0,
      Number(get(this, 'goToWallPGain')) || 0,
      get(this, 'disableLocalisation') === true ? 1 : 0,
      Number(get(this, 'timeToWait')) || 0,
      `"${btoa(String(get(this, 'message')))}"`
    ].join();

    return serialized;
  },

  deserialize(data) {
    const pointsToFace = [];
    const numbers = data.slice(0, 27).map(Number);

    set(this, 'type',                  eventTypes[numbers[0]]);
    set(this, 'x',                     numbers[1]);
    set(this, 'y',                     numbers[2]);
    set(this, 'relativePointX',        numbers[3]);
    set(this, 'relativePointY',        numbers[4]);
    set(this, 'pointToFaceX',          numbers[5]);
    set(this, 'pointToFaceY',          numbers[6]);
    set(this, 'rampMinValue',          numbers[7]);
    set(this, 'errorCorrectionP',      numbers[8]);
    set(this, 'pSaturation',           numbers[9]);
    set(this, 'facePointP',            numbers[10]);
    set(this, 'facePointPSaturation',  numbers[11]);
    set(this, 'maxSpeed',              numbers[12]);
    set(this, 'rampDistance',          numbers[13]);
    set(this, 'tolerance',             numbers[14]);
    set(this, 'acceleration',          numbers[15]);
    set(this, 'rampCurveExponent',     numbers[16]);
    set(this, 'stopAtEndOfLine',       numbers[17] === 1);
    set(this, 'face',                  numbers[18]);
    set(this, 'angleToFace',           numbers[19] / Math.PI * 180);
    set(this, 'radius',                numbers[20]);
    set(this, 'curveErrorCorrectionP', numbers[21]);
    set(this, 'servoIndex',            numbers[22]);
    set(this, 'sensorToUse',           numbers[23]);
    set(this, 'goToWallPGain',         numbers[24]);
    set(this, 'disableLocalisation',   numbers[25] === 1);
    set(this, 'timeToWait',            numbers[26]);
    set(this, 'message',               atob(data[27] == null ? '' : data[27].substring(1, data[27].length - 1)));

    return this;
  }
});

export const parameters = [
  'x',
  'y',
  'radius',
  'relativePointX',
  'relativePointY',
  'pointToFaceX',
  'pointToFaceY',
  'rampMinValue',
  'errorCorrectionP',
  'pSaturation',
  'facePointP',
  'facePointPSaturation',
  'maxSpeed',
  'rampDistance',
  'tolerance',
  'acceleration',
  'rampCurveExponent',
  'stopAtEndOfLine',
  'face',
  'angleToFace',
  'curveErrorCorrectionP',
  'servoIndex',
  'sensorToUse',
  'goToWallPGain',
  'disableLocalisation',
  'timeToWait',
  'message'
];

import Ember from 'ember';

const {
  get,
  set,
  isEmpty
} = Ember;

export default Ember.Object.extend({
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

    // if (!isEmpty(get(this, 'dropCube'))) {
    //   serialized.push({
    //     Operation: 2,
    //     'Drop cude parameters': {
    //       'Servo index': Number(get(this, 'dropCube'))
    //     }
    //   });
    // }

    return serialized;
  }
});

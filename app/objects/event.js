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
    const serialized = [{
      Operation: get(this, 'radius') > 0 ? 1 : 0,
      'Go to parameters': {
        'Point to go to': {
          X: get(this, 'x') * 10,
          Y: get(this, 'y') * -10
        },
        'Stop at end of line': true
      },
      'Curve parameters': {
        Radius: Number(get(this, 'radius') || 0) * 10
      }
    }];

    if (!isEmpty(get(this, 'dropCube'))) {
      serialized.push({
        Operation: 2,
        'Drop cude parameters': {
          'Servo index': Number(get(this, 'dropCube'))
        }
      });
    }

    return serialized;
  }
});

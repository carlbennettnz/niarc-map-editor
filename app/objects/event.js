import Ember from 'ember';

const {
  get,
  set
} = Ember;

export default Ember.Object.extend({
  x: null,
  y: null,
  radius: null,
  isSelected: false,

  serialize() {
    return {
      Operation: get(this, 'radius') > 0 ? 2 : 1,
      'Go to parameters': {
        'Point to go to': {
          X: get(this, 'x') * 10,
          Y: get(this, 'y') * 10
        },
        'Stop at end of line': true
      },
      'Curve parameters': {
        Radius: Number(get(this, 'radius') || 0) * 10
      }
    };
  }
});
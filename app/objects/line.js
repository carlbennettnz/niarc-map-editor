import Ember from 'ember';

const {
  get,
  set
} = Ember;

export default Ember.Object.extend({
  points: {
    x1: null,
    y1: null,
    x2: null,
    y2: null
  },
  type: 'line',
  layer: null,

  serialize() {
    return [
      get(this, 'points.x1') || '',
      get(this, 'points.y1') || '',
      get(this, 'points.x2') || '',
      get(this, 'points.y2') || '',
      get(this, 'type') || '',
      get(this, 'layer') || ''
    ].join(',');
  },

  deserialize(data) {
    set(this, 'points', {});
    set(this, 'points.x1', Number(data[0] || 0));
    set(this, 'points.y1', Number(data[1] || 0));
    set(this, 'points.x2', Number(data[2] || 0));
    set(this, 'points.y2', Number(data[3] || 0));
    set(this, 'type', data[4] || null);
    set(this, 'layer', data[5] || null);

    return this;
  }
});

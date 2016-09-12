import Ember from 'ember';

const {
  get,
  set,
  computed: { alias }
} = Ember;

export default Ember.Object.extend({
  event: null,

  id: alias('event.id'),
  x: alias('event.x'),
  y: alias('event.y'),
  radius: alias('event.radius'),

  setPosition({ x, y }) {
    get(this, 'x');
    get(this, 'y');
    set(this, 'x', x);
    set(this, 'y', y);
  },

  move({ dx, dy }) {
    set(this, 'x', get(this, 'x') + dx);
    set(this, 'y', get(this, 'y') + dy);
  }
});

import Ember from 'ember';

const {
  get,
  set,
  computed: { alias }
} = Ember;

let nextId = 0;

export default Ember.Object.extend({
  init() {
    this._super(...arguments);
    set(this, 'id', nextId);
    nextId++;
  },

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

import Ember from 'ember';

const {
  get,
  set
} = Ember;

export default Ember.Object.extend({
  x: 0,
  y: 0,
  radius: 0,
  isSelected: false,
  isHighlighted: false,

  setPosition({ x, y }) {
    set(this, 'x', x);
    set(this, 'y', y);
  },

  move({ dx, dy }) {
    set(this, 'x', get(this, 'x') + dx);
    set(this, 'y', get(this, 'y') + dy);
  }
});

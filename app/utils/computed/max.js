import Ember from 'ember';

const {
  computed,
  get
} = Ember;

export default function max(a, b) {
  return computed(a, b, function() {
    return Math.max(get(this, a), get(this, b));
  });
};

import Ember from 'ember';

const {
  computed,
  get
} = Ember;

export default function min(a, b) {
  return computed(a, b, function() {
    return Math.min(get(this, a), get(this, b));
  });
};

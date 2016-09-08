import Ember from 'ember';

const {
  computed,
  get
} = Ember;

export default function absoluteDifference(a, b) {
  return computed(a, b, function() {
    return Math.abs(get(this, a) - get(this, b));
  });
};

import Ember from 'ember';

const {
  assert
} = Ember;

export function scale(params) {
  assert('Two numbers required', params && typeof params[0] === 'number' && typeof params[1] === 'number');
  return params[0] * params[1];
}

export default Ember.Helper.helper(scale);

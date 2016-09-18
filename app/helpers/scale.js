import Ember from 'ember';

const {
  assert
} = Ember;

export function scale(params) {
  assert(`Two numbers required, got '${params[0]}' and '${params[1]}'`, params && typeof params[0] === 'number' && typeof params[1] === 'number');
  return params.reduce((total, current, i) => i > 0 ? total * current : current);
}

export default Ember.Helper.helper(scale);

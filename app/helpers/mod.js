import Ember from 'ember';

export function mod(params) {
  return params[0]%10 === 0;
}

export default Ember.Helper.helper(mod);

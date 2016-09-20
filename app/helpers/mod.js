import Ember from 'ember';

export function mod([ number ] = []) {
  return number % 10 === 0;
}

export default Ember.Helper.helper(mod);

import Ember from 'ember';

export function contains(params) {
  return (params[0] || []).includes(params[1]);
}

export default Ember.Helper.helper(contains);

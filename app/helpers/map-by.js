import Ember from 'ember';

export function mapBy([ collection, key ]) {
  return collection.mapBy(key);
}

export default Ember.Helper.helper(mapBy);

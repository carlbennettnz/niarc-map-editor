import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel() {
    this.transitionTo('map.edit');
  },

  model() {
    return localStorage.map ? JSON.parse(localStorage.map) : [];
  }
});

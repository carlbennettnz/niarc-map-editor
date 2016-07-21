import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return localStorage.map ? JSON.parse(localStorage.map) : [];
  }
});

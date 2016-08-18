import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';

const {
  get,
  set,
  assign,
  assert,
  isArray,
  computed
} = Ember;

export default Ember.Controller.extend({
  // Override this
  layers: [],

  mapViewport: {
    scrollX: 300,
    scrollY: 200,
    zoom: 0.1
  },

  shapes: computed.alias('model')
});

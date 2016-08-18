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
    scrollX: -90,
    scrollY: -90,
    zoom: 1
  },

  shapes: computed.alias('model')
});

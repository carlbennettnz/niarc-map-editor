import Ember from 'ember';
import config from 'niarc-map-editor/config/environment';
import { EKMixin as EmberKeyboardMixin, keyDown } from 'ember-keyboard';

const {
  get,
  set,
  on,
  assign,
  assert,
  isArray,
  computed
} = Ember;

export default Ember.Controller.extend(EmberKeyboardMixin, {
  keyboardActivated: true,

  // Override this
  layers: [],

  mapViewport: {
    scrollX: 300,
    scrollY: 50,
    zoom: 0.1
  },

  shapes: computed.alias('model'),

  goToMap: on(keyDown('Digit1'), function() {
    this.transitionToRoute('map');
  }),

  goToPath: on(keyDown('Digit2'), function() {
    this.transitionToRoute('path');
  })
});

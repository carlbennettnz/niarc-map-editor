import Ember from 'ember';
import MapController from 'niarc-map-editor/controllers/map';

const {
  computed
} = Ember;

export default MapController.extend({
  layers: [{
    name: 'map',
    isVisible: true,
    isSelected: false
  }, {
    name: 'path',
    isVisible: true,
    isSelected: true
  }],

  shapes: computed.alias('model.lines')
});

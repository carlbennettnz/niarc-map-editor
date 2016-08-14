import Ember from 'ember';
import MapController from 'niarc-map-editor/controllers/map';

const {
  get,
  set,
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

  shapes: computed.alias('model.lines'),

  actions: {
    addPath(path) {
      let events = get(this, 'model.events');

      if (!events) {
        events = set(this, 'model.events', []);
      }

      events.pushObject(path);
      this.send('saveModel');
    },

    selectHandle(path, handleIndex) {
      const point = get(path, 'points').objectAt(handleIndex);
      set(point, 'isSelected', true);
    }
  }
});

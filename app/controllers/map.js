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
    scrollX: 30,
    scrollY: 30,
    zoom: 1
  },

  shapes: computed.alias('model'),

  actions: {
    addShape(shape) {
      assert('Line must be provided', shape != null);
      assert('Line must have points', typeof get(shape, 'points') === 'object');
      assert('Line must have a layer', typeof get(shape, 'layer') === 'string');
      assert('Line must have an isSelected flag', typeof get(shape, 'isSelected') === 'boolean');

      let shapes = get(this, 'shapes');

      if (!shapes) {
        shapes = set(this, 'shapes', []);
      }

      shapes.pushObject(shape);
      this.send('saveModel');
    },

    selectShape(shape) {
      this.send('deselectAll');
      set(shape, 'isSelected', true);
    },

    deselectAll(shape) {
      const shapes = get(this, 'shapes') || [];
      shapes.forEach(shape => set(shape, 'isSelected', false));
    },

    resizeShape(line, points) {
      set(line, 'points', points);
      this.send('saveModel');
    },

    removeShapes(shapes) {
      const model = get(this, 'shapes') || [];
      shapes = isArray(shapes) ? shapes : [ shapes ];
      model.removeObjects(shapes);
      this.send('saveModel');
    }
  }
});

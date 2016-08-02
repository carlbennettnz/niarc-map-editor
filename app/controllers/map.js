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

  lines: computed.alias('model'),

  actions: {
    addLine(line) {
      assert('Line must be provided', line != null);
      assert('Line must have points', typeof get(line, 'points') === 'object');
      assert('Line must have a layer', typeof get(line, 'layer') === 'string');
      assert('Line must have an isSelected flag', typeof get(line, 'isSelected') === 'boolean');

      let lines = get(this, 'lines');

      if (!lines) {
        lines = set(this, 'lines', []);
      }

      lines.pushObject(line);
      this.send('saveModel');
    },

    selectLine(line) {
      this.send('deselectAll');
      set(line, 'isSelected', true);
    },

    deselectAll(line) {
      const lines = get(this, 'lines') || [];
      lines.forEach(line => set(line, 'isSelected', false));
    },

    resizeLine(line, points) {
      set(line, 'points', points);
      this.send('saveModel');
    },

    removeLines(lines) {
      const model = get(this, 'lines') || [];
      lines = isArray(lines) ? lines : [ lines ];
      model.removeObjects(lines);
      this.send('saveModel');
    }
  }
});

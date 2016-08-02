import Ember from 'ember';

const {
  get,
  set,
  assign,
  assert,
  isArray
} = Ember;

export default Ember.Controller.extend({
  layers: [{
    name: 'map',
    isVisible: true,
    isSelected: true
  }],

  mapViewport: {
    scrollX: 30,
    scrollY: 30,
    zoom: 1
  },

  saveModel() {
    const model = get(this, 'model') || [];

    const modelWithNothingSelected = model.map(line => {
      return assign({}, line, { isSelected: false });
    });

    localStorage.map = JSON.stringify(modelWithNothingSelected);
  },

  actions: {
    addLine(line) {
      assert('Line must be provided', line != null);
      assert('Line must have points', typeof get(line, 'points') === 'object');
      assert('Line must have a layer', typeof get(line, 'layer') === 'string');
      assert('Line must have an isSelected flag', typeof get(line, 'isSelected') === 'boolean');

      let model = get(this, 'model');

      if (!model) {
        model = set(this, 'model', []);
      }

      model.pushObject(line);
      this.saveModel();
    },

    selectLine(line) {
      this.send('deselectAll');
      set(line, 'isSelected', true);
    },

    deselectAll(line) {
      const model = get(this, 'model') || [];
      model.forEach(line => set(line, 'isSelected', false));
    },

    resizeLine(line, points) {
      set(line, 'points', points);
      this.saveModel();
    },

    removeLines(lines) {
      const model = get(this, 'model') || [];
      lines = isArray(lines) ? lines : [ lines ];
      model.removeObjects(lines);
      this.saveModel();
    }
  }
});

import MapController from 'niarc-map-editor/controllers/map';

export default MapController.extend({
  layers: [{
    name: 'map',
    isVisible: true,
    isSelected: true
  }],

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
      console.log(shapes)
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

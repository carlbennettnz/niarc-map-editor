import Ember from 'ember';
import { EKMixin } from 'ember-keyboard';
import * as geometry from 'niarc-map-editor/utils/geometry';

const {
  get,
  set,
  computed,
  assert,
  assign,
  on
} = Ember;

export default Ember.Component.extend(EKMixin, {
  // State
  tool: null,
  toolState: {},

  // Model
  shapes: [],

  // Config
  keyboardActivated: true,
  gridSize: 20,
  clickToSelectTolerance: 10, // how many pixels away can you click and still select the shape?
  viewport: {
    scrollX: 0,
    scrollY: 0,
    zoom: 1
  },

  scrollTransform: computed('viewport.scrollX', 'viewport.scrollY', function() {
    const x = get(this, 'viewport.scrollX');
    const y = get(this, 'viewport.scrollY');

    return `translate(${x}, ${y})`;
  }),

  selectedLayerName: computed('layers.@each.isSelected', function() {
    const layer = (get(this, 'layers') || []).findBy('isSelected');
    return get(layer || {}, 'name');
  }),

  getScaledAndOffsetPoint(x, y) {
    const scrollX = get(this, 'viewport.scrollX');
    const scrollY = get(this, 'viewport.scrollY');
    const zoom = get(this, 'viewport.zoom');

    return {
      x: (x - scrollX) / zoom,
      y: (y - scrollY) / zoom
    };
  },

  getHandlesAtPoint(point) {
    const shapes = get(this, 'shapes') || [];
    const tolerance = get(this, 'clickToSelectTolerance');
    const found = [];

    shapes.forEach(shape => {
      const handles = [
        { x: get(shape, 'points.x1'), y: get(shape, 'points.y1') },
        { x: get(shape, 'points.x2'), y: get(shape, 'points.y2') }
      ];

      const collisions = handles.map(handle => geometry.checkPointCollision(point, handle, tolerance));

      if (collisions.contains(true)) {
        found.pushObject({
          handleIndex: collisions.indexOf(true) + 1,
          shape
        });
      }
    });

    return found;
  },

  getLineAtPoint(point, options = {}) {
    // Reverse because we want to select shape on top first and the last shapes render on top
    const shapes = (get(this, 'shapes') || []).reverse();
    const tolerance = get(this, 'clickToSelectTolerance');

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes.objectAt(i);
      const selectedOnly = get(options, 'selectedOnly');
      const layerName = get(options, 'layerName');

      if (selectedOnly && !get(shape, 'isSelected')) {
        continue;
      }

      if (layerName && layerName !== get(shape, 'layer')) {
        continue;
      }

      // Yes, shape.points.x1 would work, but doing it this way ensures Ember observers are triggered
      // and computed properties are refreshed, if we one day wanted to add some.
      const shapePoints = {
        x1: get(shape, 'points.x1'),
        y1: get(shape, 'points.y1'),
        x2: get(shape, 'points.x2'),
        y2: get(shape, 'points.y2')
      };

      if (geometry.checkLineCollision(point, shapePoints, tolerance)) {
        return shape;
      }
    }
  },

  snapPointToGrid(point, gridSize) {
    assert('Grid size is required', gridSize);
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  },

  snapPointsToAxis(fixed, variable) {
    const xSize = Math.abs(get(fixed, 'x') - get(variable, 'x'));
    const ySize = Math.abs(get(fixed, 'y') - get(variable, 'y'));

    // Snap to an axis
    return {
      x: xSize > ySize ? get(variable, 'x') : get(fixed, 'x'),
      y: xSize > ySize ? get(fixed, 'y') : get(variable, 'y')
    };
  }
});

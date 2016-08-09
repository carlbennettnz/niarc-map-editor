import Ember from 'ember';
import { EKMixin, keyDown, getCode } from 'ember-keyboard';
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
  mouseAction: null,
  newShape: null,
  selectedHandle: null,
  tool: null,

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

  mouseDown(event) {
    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    // Avoids error if action fires at the same time as component is destroyed
    if (get(this, 'isDestroying')) {
      return;
    }

    set(this, 'mouseDidDrag', false);

    const handle = this.getHandleAtPoint(point);

    // If over a handle, start moving that handle
    if (handle) {
      set(this, 'mouseAction', 'moveHandle');
      // this.startMoveHandle(point, handle);
      this.trigger('startMoveHandle', point, handle);
      return;
    }

    const layerName = get(this, 'selectedLayerName');
    const shape = this.getLineAtPoint(point, { selectedOnly: true, layerName });

    // If over a selected line, start moving that line
    if (shape && get(shape, 'isSelected')) {
      set(this, 'mouseAction', 'moveShape');
      this.trigger('startMoveShape', point, shape);
      return;
    }

    // Else start a new line
    set(this, 'mouseAction', 'adjustNewShape');
    this.trigger('startNewShape', point);
  },

  mouseMove(event) {
    const mouseAction = get(this, 'mouseAction');

    if (get(this, 'isDestroying')) {
      return;
    }

    if (!event.buttons || !mouseAction) {
      set(this, 'newLine', null);
      set(this, 'draggingHandle', null);
      return;
    }

    set(this, 'mouseDidDrag', true);

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    switch (mouseAction) {
      case 'moveHandle':
        this.trigger('doMoveHandle', point);
        break;

      case 'moveShape':
        this.trigger('doMoveShape', point);
        break;

      case 'adjustNewShape':
        this.trigger('adjustNewShape', point);
        break;
    }
  },

  mouseUp(event) {
    const action = get(this, 'mouseAction');
    const didDrag = get(this, 'mouseDidDrag');

    // Select clicked lines if they're not already clicked and the pointer has not moved since mousedown
    if (action !== 'moveHandle' && action !== 'moveShape' && didDrag === false) {
      const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);
      const layerName = get(this, 'selectedLayerName');
      const shape = this.getLineAtPoint(point, { layerName });

      if (shape) {
        this.sendAction('select', shape);
      }
    }

    set(this, 'mouseAction', null);
  },

  getScaledAndOffsetPoint(x, y) {
    const scrollX = get(this, 'viewport.scrollX');
    const scrollY = get(this, 'viewport.scrollY');
    const zoom = get(this, 'viewport.zoom');

    return {
      x: (x - scrollX) / zoom,
      y: (y - scrollY) / zoom
    };
  },

  deleteShape: on(keyDown('Backspace'), function(event) {
    event.preventDefault();

    const selected = get(this, 'shapes').findBy('isSelected');

    if (selected) {
      this.sendAction('remove', selected);
    }
  }),

  moveShapeWithKeyboard: on(keyDown(), function(event) {
    // If the user is focused on an input, don't hijack their key events
    if (event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    const code = getCode(event);
    const map = {
      'ArrowLeft':  [ -1, 0 ],
      'ArrowUp':    [ 0, -1 ],
      'ArrowRight': [ 1, 0 ],
      'ArrowDown':  [ 0, 1 ]
    };

    if (map[code]) {
      this.trigger('moveSelectedShapeOnGrid', ...map[code], event);
      event.preventDefault();
    }
  }),

  getHandleAtPoint(point) {
    const selected = (get(this, 'shapes') || []).findBy('isSelected');
    const tolerance = get(this, 'clickToSelectTolerance');

    if (!selected) {
      return null;
    }

    const handles = [
      { x: get(selected, 'points.x1'), y: get(selected, 'points.y1') },
      { x: get(selected, 'points.x2'), y: get(selected, 'points.y2') }
    ];

    const collisions = handles.map(handle => geometry.checkPointCollision(point, handle, tolerance));

    if (collisions.contains(true)) {
      return {
        handleIndex: collisions.indexOf(true) + 1,
        shape: selected
      };
    }

    return null;
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

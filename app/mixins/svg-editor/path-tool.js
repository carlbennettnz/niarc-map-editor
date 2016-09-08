import Ember from 'ember';
import { keyDown, getCode } from 'ember-keyboard';
import * as geometry from 'niarc-map-editor/utils/geometry';

import Path from 'niarc-map-editor/objects/path';
import PathPoint from 'niarc-map-editor/objects/path-point';

const {
  get,
  set,
  assign,
  on
} = Ember;

export default Ember.Mixin.create({
  handleMouseDown: on('mouseDown', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    set(this, 'toolState.mouseDidDrag', false);

    const handlesAtPoint = this.getPathHandlesAtPoint(point);
    let selectedHandle = handlesAtPoint.find(handle => {
      const points = get(handle, 'shape.points') || [];
      const index = get(handle, 'handleIndex');
      const point = points.objectAt(index)
      return point && get(point, 'isSelected');
    });

    // If over a handle, but not a selected one, select it
    if (handlesAtPoint.length && !selectedHandle) {
      selectedHandle = handlesAtPoint.objectAt(0);
      const { shape, handleIndex } = selectedHandle;
      shape.selectPoint(handleIndex);
    }

    // If over a selected handle, start moving that handle
    if (selectedHandle) {
      set(this, 'toolState.mouseAction', 'moveHandle');
      this.startMoveHandle(point, selectedHandle);
      return;
    }

    const layerName = get(this, 'selectedLayerName');
    const shape = this.getLineAtPoint(point, { selectedOnly: true, layerName });

    // If over a selected line, start moving that line
    if (shape) {
      set(this, 'toolState.mouseAction', 'moveLine');
      this.startMoveLine(point, shape);
      return;
    }

    const existingPath = get(this, 'shapes').findBy('type', 'path');

    if (existingPath) {
      set(this, 'toolState.mouseAction', 'moveHandle');
      this.startNewLineSegment(existingPath, point);
      return;
    }

    // Else start a new path
    set(this, 'toolState.mouseAction', 'adjustNewLine');
    this.startNewPath(point);
  }),

  handleMouseMove: on('mouseMove', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const mouseAction = get(this, 'toolState.mouseAction');

    if (!event.buttons && mouseAction) {
      set(this, 'toolState.newLine', null);
      set(this, 'toolState.draggingHandle', null);
      return;
    }

    set(this, 'toolState.mouseDidDrag', true);

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    switch (mouseAction) {
      case 'moveHandle':
        this.doMoveHandle(point);
        break;

      case 'moveLine':
        this.doMoveShape(point);
        break;

      case 'adjustNewLineSegment':
        this.adjustNewLineSegment(point);
        break;

      case 'adjustNewLine':
        this.adjustNewPath(point);
        break;

      case null:
        this.highlightHandle(point);
        break;
    }
  }),

  handleMouseUp: on('mouseUp', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const action = get(this, 'toolState.mouseAction');
    const didDrag = get(this, 'toolState.mouseDidDrag');

    // Select clicked lines if they're not already clicked and the pointer has not moved since mousedown
    if (action !== 'moveHandle' && action !== 'moveShape' && didDrag === false) {
      const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);
      const layerName = get(this, 'selectedLayerName');
      const handleData = this.getPathHandlesAtPoint(point).objectAt(0);

      if (handleData) {
        const { shape, handleIndex } = handleData;
        shape.selectPoint(handleIndex);
      }
    }

    set(this, 'toolState.mouseAction', null);
  }),

  handleBackspace: on(keyDown('Backspace'), function(event) {
    if (guard.apply(this, arguments) || event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    event.preventDefault();
    this.deleteSelectedHandles();
  }),

  handleArrowKeys: on(keyDown(), function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    // If the user is focused on an input, don't hijack their key events
    if (event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    const code = getCode(event);
    const map = {
      'ArrowLeft':  [ -1, 0 ],
      'ArrowUp':    [ 0, 1 ],
      'ArrowRight': [ 1, 0 ],
      'ArrowDown':  [ 0, -1 ]
    };

    if (map[code]) {
      this.moveSelectedHandlesOnGrid(...map[code]);
      event.preventDefault();
    }
  }),

  deselect: on(keyDown('Escape'), function(event) {
    this.sendAction('deselectAll');
  }),

  getPathWithSelectedHandle() {
    const paths = get(this, 'shapes').filterBy('type', 'path');
    let selected;

    paths.forEach(path => {
      if (get(path, 'points').findBy('isSelected')) {
        selected = path;
      }
    });

    return selected;
  },

  getPathHandlesAtPoint(point) {    
    if (guard.apply(this, arguments)) {
      return;
    }

    const shapes = get(this, 'shapes').filterBy('type', 'path');
    const tolerance = get(this, 'clickToSelectTolerance');
    const found = [];

    shapes.forEach(shape => {
      const collisions = get(shape, 'points').map(handle => geometry.checkPointCollision(point, handle, tolerance));

      if (collisions.contains(true)) {
        found.pushObject({
          handleIndex: collisions.indexOf(true),
          shape
        });
      }
    });

    return found;
  },

  startMoveHandle(point, handle) {
    if (guard.apply(this, arguments)) {
      return;
    }

    set(this, 'toolState.handleBeingMoved', handle);
  },

  doMoveHandle(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const handleBeingMoved = get(this, 'toolState.handleBeingMoved');

    if (!handleBeingMoved) {
      return;
    }

    const { handleIndex, shape } = handleBeingMoved;
    const pointToMove = get(shape, 'points.' + handleIndex);

    const gridSize = get(this, 'gridSize');
    const snappedToGrid = this.snapPointToGrid(point, gridSize);

    set(pointToMove, 'isSelected', true);
    pointToMove.setPosition(snappedToGrid);
  },

  startMoveLine(point, line) {
    if (guard.apply(this, arguments)) {
      return;
    }

    set(this, 'toolState.lineBeingMoved', {
      line,
      initialMousePos: point,
      initialLinePos: Ember.assign({}, get(line, 'points'))
    });
  },

  startNewPath(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const gridSize = get(this, 'gridSize');
    const snapped = PathPoint.create(this.snapPointToGrid(point, gridSize));
    const layer = get(this, 'selectedLayerName');

    this.sendAction('deselectAll');

    set(this, 'toolState.newLine', Path.create({
      points: [ snapped, snapped ],
      type: 'path',
      layer
    }));
  },

  adjustNewPath(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const newLine = get(this, 'toolState.newLine');
    const gridSize = get(this, 'gridSize');

    const point0 = get(newLine, 'points.0');
    const point1 = PathPoint.create(this.snapPointToGrid(point, gridSize));

    // The line would still have zero length, don't do anything yet
    if (get(point0, 'x') === get(point1, 'x') && get(point0, 'y') === get(point1, 'y')) {
      return;
    }

    this.sendAction('add', newLine);

    set(this, 'toolState.handleBeingMoved', {
      handleIndex: 1,
      shape: newLine
    });

    set(this, 'toolState.newLine', null);
    set(this, 'toolState.mouseAction', 'moveHandle');

    this.doMoveHandle(point);
  },

  startNewLineSegment(path, point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const points = get(path, 'points');
    const lastPoint = get(points, 'lastObject');
    
    points.pushObject(lastPoint);

    set(this, 'toolState.handleBeingMoved', {
      handleIndex: points.length - 1,
      shape: path
    });

    this.doMoveHandle(point);
    path.selectPoint(points.length - 1);
  },

  moveSelectedHandlesOnGrid(dx, dy) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const selected = this.getPathWithSelectedHandle();

    if (selected) {
      const points = get(selected, 'points');
      const handles = points.filterBy('isSelected');
      const gridSize = get(this, 'gridSize');

      handles.forEach(handle => handle.move({
        dx: gridSize * dx,
        dy: gridSize * dy
      }));
    }
  },

  deleteSelectedHandles() {
    if (guard.apply(this, arguments)) {
      return;
    }

    const path = get(this, 'path');
    const selectedPoints = get(path, 'points').filterBy('isSelected');
    console.log(path, selectedPoints)
    path.removePoints(selectedPoints);
  },

  highlightHandle(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const path = get(this, 'path');
    const handle = this.getPathHandlesAtPoint(point)[0];
    
    path.highlightPoint(get(handle || {}, 'handleIndex'));
  }
});

function guard() {
  this._super(...arguments);
  return get(this, 'tool') !== 'path' || get(this, 'isDestroying');
}

import Ember from 'ember';
import { keyDown, getCode } from 'ember-keyboard';

const {
  get,
  set,
  assign,
  on
} = Ember;

export default Ember.Mixin.create({
  init() {
    this._super(...arguments);
    set(this, 'tool', 'path');
  },

  handleMouseDown: on('mouseDown', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    // Avoids error if action fires at the same time as component is destroyed
    if (get(this, 'isDestroying')) {
      return;
    }

    set(this, 'toolState.mouseDidDrag', false);

    const handle = this.getHandlesAtPoint(point).findBy('shape.isSelected');

    // If over a selected handle, start moving that handle
    if (handle) {
      set(this, 'toolState.mouseAction', 'moveHandle');
      this.startMoveHandle(point, handle);
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

    // Else start a new line
    set(this, 'toolState.mouseAction', 'adjustNewLine');
    this.startNewLine(point);
  }),

  handleMouseMove: on('mouseMove', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const mouseAction = get(this, 'toolState.mouseAction');

    if (!event.buttons || !mouseAction) {
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
        this.adjustNewLine(point);
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
      const handleData = this.getHandlesAtPoint(point, { layerName }).objectAt(0);

      if (handleData) {
        const { shape, handleIndex } = handleData;
        this.sendAction('selectHandle', shape, handleIndex);
      }
    }

    set(this, 'toolState.mouseAction', null);
  }),

  handleBackspace: on(keyDown('Backspace'), function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    event.preventDefault();
    this.deleteSelectedLine();
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
      'ArrowUp':    [ 0, -1 ],
      'ArrowRight': [ 1, 0 ],
      'ArrowDown':  [ 0, 1 ]
    };

    if (map[code]) {
      this.moveSelectedLineOnGrid(...map[code], event);
      event.preventDefault();
    }
  }),

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
    const gridSize = get(this, 'gridSize');
    const snappedToGrid = this.snapPointToGrid(point, gridSize);
    const newPoints = assign([], get(shape, 'points'), { [handleIndex]: snappedToGrid });

    // Avoid giving the line zero length
    // if (newPoints.x1 === newPoints.x2 && newPoints.y1 === newPoints.y2) {
    //   return;
    // }

    this.sendAction('resize', shape, newPoints);
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

    this.sendAction('select', line);
  },

  doMoveLine(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const lineBeingMoved = get(this, 'lineBeingMoved');

    if (!lineBeingMoved) {
      return;
    }

    const { line, initialMousePos, initialLinePos } = lineBeingMoved;
    const gridSize = get(this, 'gridSize');

    const delta = {
      x: point.x - initialMousePos.x,
      y: point.y - initialMousePos.y
    };

    const snappedDelta = this.snapPointToGrid(delta, gridSize);

    const newPos = {
      x1: get(initialLinePos, 'x1') + snappedDelta.x,
      y1: get(initialLinePos, 'y1') + snappedDelta.y,
      x2: get(initialLinePos, 'x2') + snappedDelta.x,
      y2: get(initialLinePos, 'y2') + snappedDelta.y
    };

    this.sendAction('resize', line, newPos);
  },

  startNewLine(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const gridSize = get(this, 'gridSize');
    const snapped = this.snapPointToGrid(point, gridSize);
    const layer = get(this, 'selectedLayerName');

    this.sendAction('deselectAll');

    set(this, 'toolState.newLine', {
      points: [ snapped, snapped ],
      isSelected: false,
      type: 'path',
      layer
    });
  },

  adjustNewLine(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const newLine = get(this, 'toolState.newLine');
    const gridSize = get(this, 'gridSize');

    const point0 = get(newLine, 'points.0');
    const point1 = this.snapPointToGrid(point, gridSize);

    // The line would still have zero length, don't do anything yet
    if (point0.x === point1.x && point0.y === point1.y) {
      return;
    }

    this.sendAction('add', newLine);
    this.sendAction('select', newLine);

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
    const newPoints = [ ...points, get(points, 'lastObject') ];

    this.sendAction('resize', path, newPoints);

    set(this, 'toolState.handleBeingMoved', {
      handleIndex: newPoints.length - 1,
      shape: path
    });

    this.doMoveHandle(point);
  },

  moveSelectedLineOnGrid(dx, dy) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const selected = get(this, 'lines').findBy('isSelected');
    return this.moveLineOnGrid(selected, dx, dy);
  },

  moveLineOnGrid(line, dx, dy) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const gridSize = get(this, 'gridSize');

    if (line) {
      this.sendAction('resize', line, {
        x1: get(line, 'points.x1') + dx * gridSize,
        y1: get(line, 'points.y1') + dy * gridSize,
        x2: get(line, 'points.x2') + dx * gridSize,
        y2: get(line, 'points.y2') + dy * gridSize,
      });
    }
  },

  deleteSelectedLine() {
    if (guard.apply(this, arguments)) {
      return;
    }

    const selected = get(this, 'shapes').findBy('isSelected');

    if (selected) {
      this.sendAction('remove', selected);
    }
  }
});

function guard() {
  this._super(...arguments);
  return get(this, 'tool') !== 'path' || get(this, 'isDestroying');
}

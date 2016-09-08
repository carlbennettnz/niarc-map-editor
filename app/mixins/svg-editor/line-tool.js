import Ember from 'ember';
import { keyDown, getCode } from 'ember-keyboard';
import * as geometry from 'niarc-map-editor/utils/geometry';

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

    set(this, 'toolState.mouseDidDrag', false);

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);
    console.log(point)
    const handle = this.getLineHandlesAtPoint(point).findBy('shape.isSelected');

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
        this.doMoveLine(point);
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
      const shape = this.getLineAtPoint(point, { layerName });

      if (shape) {
        this.sendAction('select', shape);
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

  getLineHandlesAtPoint(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const shapes = get(this, 'shapes').filterBy('type', 'line');
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

    // The point at the end of the line we're not moving
    const fixedPoint = {
      x: get(shape, `points.x${handleIndex % 2 + 1}`),
      y: get(shape, `points.y${handleIndex % 2 + 1}`)
    };

    const snappedToGrid = this.snapPointToGrid(point, gridSize);

    const newPoints = assign({}, get(shape, 'points'), {
      [`x${handleIndex}`]: snappedToGrid.x,
      [`y${handleIndex}`]: snappedToGrid.y
    });

    // Avoid giving the line zero length
    if (newPoints.x1 === newPoints.x2 && newPoints.y1 === newPoints.y2) {
      return;
    }

    this.sendAction('resize', shape, newPoints);
  },

  startMoveLine(point, line) {
    if (guard.apply(this, arguments)) {
      return;
    }

    set(this, 'toolState.lineBeingMoved', {
      line,
      initialMousePos: point,
      initialLinePos: assign({}, get(line, 'points'))
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
      points: {
        x1: snapped.x,
        y1: snapped.y,
        x2: snapped.x,
        y2: snapped.y
      },
      isSelected: false,
      type: 'line',
      layer
    });
  },

  adjustNewLine(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const newLine = get(this, 'toolState.newLine');
    const gridSize = get(this, 'gridSize');

    const point1 = {
      x: get(newLine, 'points.x1'),
      y: get(newLine, 'points.y1')
    };

    const point2 = this.snapPointToGrid(point, gridSize);

    // The line would still have zero length, don't do anything yet
    if (point1.x === point2.x && point1.y === point2.y) {
      return;
    }

    this.sendAction('add', newLine);
    this.sendAction('select', newLine);

    set(this, 'toolState.handleBeingMoved', {
      handleIndex: 2,
      shape: newLine
    });

    set(this, 'toolState.newLine', null);
    set(this, 'toolState.mouseAction', 'moveHandle');

    this.trigger('doMoveHandle', point);
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
  return get(this, 'tool') !== 'line' || get(this, 'isDestroying');
}

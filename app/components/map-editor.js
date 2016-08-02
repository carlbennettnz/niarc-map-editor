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
  newLine: null,
  selectedHandle: null,

  // Model
  lines: [],

  // Config
  keyboardActivated: true,
  gridSize: 20,
  clickToSelectTolerance: 10, // how many pixels away can you click and still select the line?
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
      this.startMoveHandle(point, handle);
      return;
    }

    const line = this.getLineAtPoint(point);

    // If over a selected line, start moving that line
    if (line && get(line, 'isSelected')) {
      set(this, 'mouseAction', 'moveLine');
      this.startMoveLine(point, line);
      return;
    }

    // Else start a new line
    set(this, 'mouseAction', 'adjustNewLine');
    this.startNewLine(point);
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
        this.doMoveHandle(point);
        break;

      case 'moveLine':
        this.doMoveLine(point);
        break;

      case 'adjustNewLine':
        this.adjustNewLine(point);
        break;
    }
  },

  mouseUp(event) {
    const action = get(this, 'mouseAction');
    const didDrag = get(this, 'mouseDidDrag');

    // Select clicked lines if they're not already clicked and the pointer has not moved since mousedown
    if (action !== 'moveHandle' && action !== 'moveLine' && didDrag === false) {
      const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);
      const line = this.getLineAtPoint(point);

      if (line) {
        this.sendAction('select', line);
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

  deleteLine: on(keyDown('Backspace'), function(event) {
    event.preventDefault();

    const selected = get(this, 'lines').findBy('isSelected');

    if (selected) {
      this.sendAction('remove', selected);
    }
  }),

  moveLineWithKeyboard: on(keyDown(), function(event) {
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
      this.moveSelectedLineOnGrid(...map[code]);
      event.preventDefault();
    }
  }),

  getHandleAtPoint(point) {
    const selected = (get(this, 'lines') || []).findBy('isSelected');
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
        line: selected
      };
    }

    return null;
  },

  getLineAtPoint(point) {
    // Reverse because we want to select lines on top first and the last lines render on top
    const lines = get(this, 'lines').reverse();
    const tolerance = get(this, 'clickToSelectTolerance');

    for (let i = 0; i < lines.length; i++) {
      const line = lines.objectAt(i);

      // Yes, line.points.x1 would work, but doing it this way ensures Ember observers are triggered
      // and computed properties are refreshed, if we one day wanted to add some.
      const linePoints = {
        x1: get(line, 'points.x1'),
        y1: get(line, 'points.y1'),
        x2: get(line, 'points.x2'),
        y2: get(line, 'points.y2')
      };

      if (geometry.checkLineCollision(point, linePoints, tolerance)) {
        return line;
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
  },

  startMoveHandle(point, handle) {
    set(this, 'handleBeingMoved', handle);
  },

  doMoveHandle(point) {
    const handleBeingMoved = get(this, 'handleBeingMoved');

    if (!handleBeingMoved) {
      return;
    }

    const { handleIndex, line } = handleBeingMoved;
    const gridSize = get(this, 'gridSize');

    // The point at the end of the line we're not moving
    const fixedPoint = {
      x: get(line, `points.x${handleIndex % 2 + 1}`),
      y: get(line, `points.y${handleIndex % 2 + 1}`)
    };

    const snappedToGrid = this.snapPointToGrid(point, gridSize);

    const newPoints = assign({}, get(line, 'points'), {
      [`x${handleIndex}`]: snappedToGrid.x,
      [`y${handleIndex}`]: snappedToGrid.y
    });

    // Avoid giving the line zero length
    if (newPoints.x1 === newPoints.x2 && newPoints.y1 === newPoints.y2) {
      return;
    }

    this.sendAction('resize', line, newPoints);
  },

  startMoveLine(point, line) {
    set(this, 'lineBeingMoved', {
      line,
      initialMousePos: point,
      initialLinePos: Ember.assign({}, get(line, 'points'))
    });

    this.sendAction('select', line);
  },

  doMoveLine(point) {
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
    const gridSize = get(this, 'gridSize');
    const snapped = this.snapPointToGrid(point, gridSize);

    this.sendAction('deselectAll');

    set(this, 'newLine', {
      points: {
        x1: snapped.x,
        y1: snapped.y,
        x2: snapped.x,
        y2: snapped.y
      }
    });
  },

  adjustNewLine(point) {
    const newLine = get(this, 'newLine');
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

    set(this, 'handleBeingMoved', {
      handleIndex: 2,
      line: newLine
    });

    set(this, 'newLine', null);
    set(this, 'mouseAction', 'moveHandle');

    this.doMoveHandle(point);
  },

  moveSelectedLineOnGrid(dx, dy) {
    const selected = get(this, 'lines').findBy('isSelected');
    return this.moveLineOnGrid(selected, dx, dy);
  },

  moveLineOnGrid(line, dx, dy) {
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

  actions: {
    clear() {
      this.sendAction('remove', get(this, 'lines'));
    }
  }
});

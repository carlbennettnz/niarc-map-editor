import Ember from 'ember';

const {
  get,
  set,
  assign,
  on
} = Ember;

export default Ember.Mixin.create({
  init() {
    this._super(...arguments);
    set(this, 'tool', 'line');
  },

  startMoveLineHandle: on('startMoveHandle', function(point, handle) {
    if (get(this, 'tool') !== 'line') {
      return;
    }

    set(this, 'handleBeingMoved', handle);
  }),

  doMoveLineHandle: on('doMoveHandle', function(point) {
    if (get(this, 'tool') !== 'line') {
      return;
    }

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
  }),

  startMoveLine: on('startMoveShape', function(point, line) {
    if (get(this, 'tool') !== 'line') {
      return;
    }

    set(this, 'lineBeingMoved', {
      line,
      initialMousePos: point,
      initialLinePos: Ember.assign({}, get(line, 'points'))
    });

    this.sendAction('select', line);
  }),

  doMoveLine: on('doMoveShape', function(point) {
    if (get(this, 'tool') !== 'line') {
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
  }),

  startNewLine: on('startNewShape', function(point) {
    if (get(this, 'tool') !== 'line') {
      return;
    }

    const gridSize = get(this, 'gridSize');
    const snapped = this.snapPointToGrid(point, gridSize);
    const layer = get(this, 'selectedLayerName');

    this.sendAction('deselectAll');

    set(this, 'newLine', {
      points: {
        x1: snapped.x,
        y1: snapped.y,
        x2: snapped.x,
        y2: snapped.y
      },
      isSelected: false,
      layer
    });
  }),

  adjustNewLine: on('adjustNewShape', function(point) {
    if (get(this, 'tool') !== 'line') {
      return;
    }

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
  }),

  moveSelectedLineOnGrid: on('moveSelectedShapeOnGrid', function(dx, dy) {
    if (get(this, 'tool') !== 'line') {
      return;
    }

    const selected = get(this, 'lines').findBy('isSelected');
    return this.moveLineOnGrid(selected, dx, dy);
  }),

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
  }
});

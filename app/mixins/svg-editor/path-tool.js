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
    set(this, 'tool', 'path');
  },

  startMoveLineHandle: on('startMoveHandle', function(point, handle) {
    if (get(this, 'tool') !== 'path') {
      return;
    }

    set(this, 'handleBeingMoved', handle);
  }),

  doMoveLineHandle: on('doMoveHandle', function(point) {
    const tool = get(this, 'tool');
    const handleBeingMoved = get(this, 'handleBeingMoved');
    
    if (tool !== 'path' || !handleBeingMoved) {
      return;
    }

    const { handleIndex, shape } = handleBeingMoved;
    const gridSize = get(this, 'gridSize');

    // The point at the end of the line we're not moving
    const fixedPoint = get(shape, 'points').objectAt(1 - handleIndex);
    const snapped = this.snapPointToGrid(point, gridSize);

    const newPoints = [];
    get(shape, 'points').forEach(p => newPoints.push(p));
    newPoints[handleIndex] = snapped;

    // Avoid giving the line zero length
    // if (newPoints[0].x === newPoints[1].x && newPoints[0].y === newPoints[1].y) {
      // return;
    // }

    console.log(`sending ${newPoints.length} points`);

    this.sendAction('resize', shape, newPoints);
  }),

  startMoveLine: on('startMoveShape', function(point, line) {
    if (get(this, 'tool') !== 'path') {
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
    if (get(this, 'tool') !== 'path') {
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
    if (get(this, 'tool') !== 'path') {
      return;
    }

    const gridSize = get(this, 'gridSize');
    const snapped = this.snapPointToGrid(point, gridSize);
    const layer = get(this, 'selectedLayerName');

    const path = get(this, 'shapes').find(path => {
      return get(path, 'isSelected') && get(path, 'layer') === layer && get(path, 'type') === 'path';
    });
    
    if (path) {
      this.addLineSegment(path, snapped);
    } else {
      this.sendAction('deselectAll');

      set(this, 'newLine', {
        points: [ snapped, snapped ],
        isSelected: false,
        type: 'path',
        layer
      });
    }
  }),

  adjustNewLine: on('adjustNewShape', function(point) {
    const tool = get(this, 'tool');
    const newLine = get(this, 'newLine');
    
    if (tool !== 'path' || !newLine) {
      return;
    }

    const gridSize = get(this, 'gridSize');
    const point1 = get(newLine, 'points.0');
    const point2 = this.snapPointToGrid(point, gridSize);

    // The line would still have zero length, don't do anything yet
    if (point1.x === point2.x && point1.y === point2.y) {
      return;
    }

    this.sendAction('add', newLine);
    this.sendAction('select', newLine);

    set(this, 'handleBeingMoved', {
      handleIndex: 1,
      shape: newLine
    });

    set(this, 'newLine', null);
    set(this, 'mouseAction', 'moveHandle');

    this.trigger('doMoveHandle', point);
  }),

  moveSelectedLineOnGrid: on('moveSelectedShapeOnGrid', function(dx, dy) {
    if (get(this, 'tool') !== 'path') {
      return;
    }

    const selected = get(this, 'lines').findBy('isSelected');
    return this.moveLineOnGrid(selected, dx, dy);
  }),

  moveLineOnGrid(line, dx, dy) {
    const gridSize = get(this, 'gridSize');

    if (line) {
      this.sendAction('resize', line, get(line, 'points').map(point => ({
        x: point.x + dx * gridSize,
        y: point.y + dy * gridSize
      })));
    }
  },

  addLineSegment(path, point) {
    const last = get(path, 'points.lastObject');

    // Don't create zero-length line segments
    if (last.x === point.x && last.y === point.y) {
      console.log('refusing to create zero-length line segment');
      return;
    }

    set(this, 'handleBeingMoved', {
      handleIndex: get(path, 'points.length'),
      shape: path
    });

    const newPoints = assign([], get(path, 'points'), {
       [get(path, 'points.length')]: point
    });

    console.log(newPoints);

    this.sendAction('resize', path, newPoints);
    set(this, 'mouseAction', 'moveHandle');
  }
});

import Ember from 'ember';

const {
  get,
  set,
  computed
} = Ember;

export default Ember.Component.extend({
  // State
  mouseAction: null,
  newLine: null,
  selectedHandle: null,

  // Model
  lines: [],

  // Config
  gridSize: 20,
  clickToSelectTolerance: 10, // how many pixels away can you click and still select the line?

  mouseDown(event) {
    const point = {
      x: event.offsetX,
      y: event.offsetY
    };

    // Avoids error if action fires at the same time as component is destroyed
    if (get(this, 'isDestroying')) {
      return;
    }

    const handle = this.getHandleAtPoint(point);

    // If over a handle, start moving that handle
    if (handle) {
      set(this, 'mouseAction', 'moveHandle');
      this.startMoveHandle(point, handle);
      return;
    }

    const line = this.getLineAtPoint(point);

    // If over a line, start moving that line
    if (line) {
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

    if (!event.buttons) {
      set(this, 'newLine', null);
      set(this, 'draggingHandle', null);
      return;
    }

    const point = {
      x: event.offsetX,
      y: event.offsetY,
    };

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

  mouseUp() {
    const mouseAction = get(this, 'mouseAction');

    switch (mouseAction) {
      case 'moveHandle':
        this.finishMoveHandle();
        break;

      case 'moveLine':
        this.finishMoveLine();
        break;

      case 'adjustNewLine':
        this.finishNewLine();
        break;
    }
  },

  click(event) {
    // Reverse because we want to select lines on top first and the last lines render on top
    const lines = (get(this, 'lines') || []).reverse();
    const tolerance = get(this, 'clickToSelectTolerance');
    const x = event.offsetX;
    const y = event.offsetY;

    this.sendAction('deselectAll');

    for (let i = 0; i < lines.length; i++) {
      const line = lines.objectAt(i);

      // Yes, line.points.x1 would work, but doing it this way ensures Ember observers are triggered
      // and computed properties are refreshed, if we one day wanted to add some.
      const p = {
        x1: get(line, 'points.x1'),
        y1: get(line, 'points.y1'),
        x2: get(line, 'points.x2'),
        y2: get(line, 'points.y2')
      };

      if (this.checkLineCollision({ x, y }, p, tolerance)) {
        this.sendAction('select', line);
        break;
      }
    }
  },

  checkPointCollision(point, target, tolerance) {
    return Math.sqrt(Math.pow(point.x - target.x, 2) + Math.pow(point.y - target.y, 2)) < tolerance;
  },

  checkLineCollision(point, target, tolerance) {
    // Swap values to ensure x1 < x2 and y1 < y2. Makes the collision check simpiler.
    if (target.x1 > target.x2) {
      [ target.x1, target.x2 ] = [ target.x2, target.x1 ];
    }

    if (target.y1 > target.y2) {
      [ target.y1, target.y2 ] = [ target.y2, target.y1 ];
    }

    // Logic here assumes horizontal or vertical lines
    const xOk = (target.x1 - point.x < tolerance && point.x - target.x2 < tolerance);
    const yOk = (target.y1 - point.y < tolerance && point.y - target.y2 < tolerance);

    return xOk && yOk;
  },

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

    const collisions = handles.map(handle => this.checkPointCollision(point, handle, tolerance));

    if (collisions.contains(true)) {
      return {
        handleIndex: collisions.indexOf(true) + 1,
        line: selected
      };
    }

    return null;
  },

  getLineAtPoint(point) {
    return false;
  },

  snapPointToGrid(point, gridSize) {
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

    const fixedPoint = {
      x: get(line, `points.x${handleIndex % 2 + 1}`),
      y: get(line, `points.y${handleIndex % 2 + 1}`)
    };

    const snappedToAxis = this.snapPointsToAxis(fixedPoint, point);
    const snappedToGrid = this.snapPointToGrid(snappedToAxis, gridSize);

    this.sendAction('moveHandle', handleIndex, line, snappedToGrid);
  },

  finishMoveHandle() {

  },

  startMoveLine(point, line) {

  },

  doMoveLine(point) {

  },

  finishMoveLine() {

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

  finishNewLine() {
    // const line = get(this, 'newLine');

    // if (!get(line, 'isHidden')) {
    //   set(line, 'isInProgress', false);
    //   this.sendAction('add', line);
    // }

    set(this, 'newLine', null);
  },

  actions: {
    clear() {
      this.sendAction('clear');
    }
  }
});

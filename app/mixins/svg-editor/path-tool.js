import Ember from 'ember';
import { keyDown, keyUp, getCode } from 'ember-keyboard';
import * as geometry from 'niarc-map-editor/utils/geometry';

import Path from 'niarc-map-editor/objects/path';
import PathPoint from 'niarc-map-editor/objects/path-point';

const {
  get,
  set,
  assign,
  on,
  run
} = Ember;

export default Ember.Mixin.create({
  handleMouseDown: on('mouseDown', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    set(this, 'toolState.mouseDidDrag', false);

    const selectedEventIds = get(this, 'selectedEventIds');
    const handlesAtPoint = this.getPathHandlesAtPoint(point);
    let selectedHandle = handlesAtPoint.find(handle => selectedEventIds.includes(get(handle, 'id')));
    let didAddPointToSelection;

    // If over a handle, but not a selected one, select it
    if (handlesAtPoint.length) {
      console.log('handles at point');
      if (event.metaKey || event.crtlKey) {
        console.log('crtl');
        this.sendAction('addPointsToSelection', [ get(handlesAtPoint[0], 'id') ]);
        console.log('added ' + get(handlesAtPoint[0], 'id'));
        selectedHandle = null;
        didAddPointToSelection = true;
      } else if (!selectedHandle) {
        this.sendAction('selectPoint', get(handlesAtPoint[0], 'id'));
        selectedHandle = handlesAtPoint[0];
      }
    }

    // If over a selected handle, start moving that handle
    if (selectedHandle) {
      set(this, 'toolState.mouseAction', 'moveHandle');
      this.startMoveHandle(point, selectedHandle);
      return;
    }

    if (!didAddPointToSelection) {
      const path = get(this, 'path');

      if (path) {
        set(this, 'toolState.mouseAction', 'moveHandle');
        this.startNewLineSegment(path, point, event.shiftKey);
        return;
      }

      // Else start a new path
      set(this, 'toolState.mouseAction', 'adjustNewLine');
      this.startNewPath(point, event.shiftKey);
    }
  }),

  handleMouseMove: on('mouseMove', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const mouseAction = get(this, 'toolState.mouseAction') || null;

    if (!event.buttons && mouseAction) {
      set(this, 'toolState.newLine', null);
      set(this, 'toolState.draggingHandle', null);
      return;
    }

    set(this, 'toolState.mouseDidDrag', true);

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    switch (mouseAction) {
      case 'moveHandle':
        this.doMoveHandle(point, event.shiftKey);
        break;

      case 'moveLine':
        this.doMoveShape(point);
        break;

      case 'adjustNewLineSegment':
        this.adjustNewLineSegment(point, event.shiftKey);
        break;

      case 'adjustNewLine':
        this.adjustNewPath(point, event.shiftKey);
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

  selectPathTool: on(keyUp('KeyP'), function() {
    set(this, 'tool', 'path');
  }),

  getPathHandlesAtPoint(point) {    
    if (guard.apply(this, arguments)) {
      return;
    }

    const handles = get(this, 'path.points') || [];
    const tolerance = get(this, 'clickToSelectTolerance');

    return handles.filter(handle => geometry.checkPointCollision(point, handle, tolerance));
  },

  startMoveHandle(point, handle) {
    if (guard.apply(this, arguments)) {
      return;
    }

    set(this, 'toolState.handleBeingMoved', handle);
  },

  doMoveHandle(point, snapToGrid = false) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const handle = get(this, 'toolState.handleBeingMoved');

    if (!handle) {
      return;
    }

    const snappedToGrid = snapToGrid ? this.snapPointToGrid(point) : point;

    Ember.assert('path exists', get(this, 'path'));
    const fromPath = get(this, 'path.points').findBy('id', get(handle, 'id'));

    fromPath.setPosition(snappedToGrid);

    this.sendAction('pathDidChange');
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

  startNewPath(point, snapToGrid) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const snapped = snapToGrid ? this.snapPointToGrid(point) : point;

    set(this, 'toolState.newLineStartingPoint', snapped);
  },

  adjustNewPath(point, snapToGrid) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const point0 = get(this, 'toolState.newLineStartingPoint');
    const point1 = snapToGrid ? this.snapPointToGrid(point) : point;

    // The line would still have zero length, don't do anything yet
    if (get(point0, 'x') === get(point1, 'x') && get(point0, 'y') === get(point1, 'y')) {
      return;
    }

    this.sendAction('addPoint', point0);
    this.sendAction('addPoint', point1);

    run.next(() => {
      this.sendAction('selectPoint', get(this, 'path.points.lastObject.id'));

      set(this, 'toolState.handleBeingMoved', get(this, 'path.points.1'));
      set(this, 'toolState.newLineStartingPoint', null);
      set(this, 'toolState.mouseAction', 'moveHandle');

      this.doMoveHandle(point, snapToGrid);
    });
  },

  startNewLineSegment(path, point, snapToGrid) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const points = get(path, 'points');
    const lastPoint = get(points, 'lastObject');
    const newPos = {
      x: get(lastPoint, 'x'),
      y: get(lastPoint, 'y')
    };
    
    this.sendAction('addPoint', newPos);
    
    run.next(() => {
      const newPoint = get(this, 'path.points.lastObject');

      this.sendAction('selectPoint', get(newPoint, 'id'));
      set(this, 'toolState.handleBeingMoved', newPoint);

      this.doMoveHandle(point, snapToGrid);
    });
  },

  moveSelectedHandlesOnGrid(dx, dy) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const path = get(this, 'path');

    if (path) {
      const selectedEventIds = get(this, 'selectedEventIds');
      const handles = get(path, 'points').filter(point => selectedEventIds.includes(get(point, 'id')));
      const gridSize = get(this, 'gridSize');

      handles.forEach(handle => handle.move({
        dx: gridSize * dx,
        dy: gridSize * dy
      }));

      if (handles.length) {
        this.sendAction('pathDidChange');
      }
    }
  },

  deleteSelectedHandles() {
    if (guard.apply(this, arguments)) {
      return;
    }

    const selectedEventIds = get(this, 'selectedEventIds');
    const path = get(this, 'path');

    if (path) {
      const points = get(path, 'points').filter(point => selectedEventIds.includes(get(point, 'id')));
      path.removePoints(points);
      this.sendAction('selectPoint', null);
      this.sendAction('pathDidChange');
    }
  },

  highlightHandle(point) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const handle = this.getPathHandlesAtPoint(point)[0];
    const handleId = handle ? get(handle, 'id') : null;
    
    this.sendAction('highlightEvent', handleId);
  }
});

function guard() {
  this._super(...arguments);
  return get(this, 'tool') !== 'path' || get(this, 'isDestroying');
}

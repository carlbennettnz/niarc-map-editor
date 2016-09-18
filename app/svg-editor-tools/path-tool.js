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
  run,
  Object: EmberObject
} = Ember;

export default EmberObject.extend({
  handleMouseDown: on('mouseDown', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    set(this, 'mouseDidDrag', false);

    const selectedEventIds = get(this, 'selectedEventIds');
    const handlesAtPoint = this.getPathHandlesAtPoint(point);
    let selectedHandle = handlesAtPoint.find(handle => selectedEventIds.includes(get(handle, 'id')));
    let didAddPointToSelection;

    // If over a handle, but not a selected one, select it
    if (handlesAtPoint.length) {
      if (event.metaKey || event.crtlKey) {
        editor.sendAction('addPointsToSelection', [ get(handlesAtPoint[0], 'id') ]);
        selectedHandle = null;
        didAddPointToSelection = true;
      } else if (!selectedHandle) {
        editor.sendAction('selectPoint', get(handlesAtPoint[0], 'id'));
        selectedHandle = handlesAtPoint[0];
      }
    }

    // If over a selected handle, start moving that handle
    if (selectedHandle) {
      set(this, 'mouseAction', 'moveHandle');
      this.startMoveHandle(point, selectedHandle);
      return;
    }

    if (!didAddPointToSelection) {
      const path = get(this, 'path');

      if (path) {
        set(this, 'mouseAction', 'moveHandle');
        this.startNewLineSegment(path, point, event.shiftKey);
        return;
      }

      // Else start a new path
      set(this, 'mouseAction', 'adjustNewLine');
      this.startNewPath(point, event.shiftKey);
    }
  }),

  handleMouseMove: on('mouseMove', function(event) {
    if (guard.apply(this, arguments)) {
      return;
    }

    const mouseAction = get(this, 'mouseAction') || null;

    if (!event.buttons && mouseAction) {
      set(this, 'newLine', null);
      set(this, 'draggingHandle', null);
      return;
    }

    set(this, 'mouseDidDrag', true);

    const point = this.getScaledAndOffsetPoint(event.clientX, event.clientY);

    switch (mouseAction) {
      case 'moveHandle':
        this.moveHandle(point, event.shiftKey);
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

    set(this, 'mouseAction', null);
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
    editor
  }),

  selectPathTool: on(keyUp('KeyP'), function() {
    set(this, 'tool', 'path');
  }),

  getPathHandlesAtPoint(point) {
    const editor = get(this, 'editor');
    const handles = get(editor, 'path.points') || [];
    const tolerance = get(editor, 'clickToSelectTolerance');

    return handles.filter(handle => geometry.checkPointCollision(point, handle, tolerance));
  },

  startMoveHandle(point, handle) {
    const editor = get(this, 'editor');

    editor.sendAction('selectPoint', get(handle, 'id'));
    set(this, 'handleBeingMoved', handle);
  },

  moveHandle(point, snapToGrid) {
    const editor = get(this, 'editor');
    const newLineStartingPoint = get(this, 'newLineStartingPoint');
    const handle = get(this, 'handleBeingMoved');

    if (newLineStartingPoint) {
      return this.adjustNewSegment(point, snapToGrid);
    }

    if (!handle) {
      return;
    }

    if (snapToGrid) {
      point = editor.snapPointToGrid(point);
    }

    const fromPath = get(editor, 'path.points').findBy('id', get(handle, 'id'));

    fromPath.setPosition(point);
    editor.sendAction('pathDidChange');
  },

  startMoveLine(point, line) {
    set(this, 'lineBeingMoved', {
      line,
      initialMousePos: point,
      initialLinePos: assign({}, get(line, 'points'))
    });
  },

  startNewPath(point, snapToGrid) {
    const editor = get(this, 'editor');

    if (snapToGrid) {
      point = editor.snapPointToGrid(point);
    }

    set(this, 'newLineStartingPoint', point);
  },

  startNewLineSegment(point, snapToGrid) {
    const editor = get(this, 'editor');
    const path = get(editor, 'path');

    if (!path || !get(path, 'points.length')) {
      return this.startNewPath(point, snapToGrid);
    }

    const points = get(path, 'points');
    const lastPoint = get(points, 'lastObject');
    const newPos = {
      x: get(lastPoint, 'x'),
      y: get(lastPoint, 'y')
    };
    
    editor.sendAction('addPoint', newPos);
    
    run.next(() => {
      const newPoint = get(editor, 'path.points.lastObject');

      editor.sendAction('selectPoint', get(newPoint, 'id'));
      set(this, 'handleBeingMoved', newPoint);

      this.moveHandle(point, snapToGrid);
    });
  },

  adjustNewSegment(point, snapToGrid) {
    const editor = get(this, 'editor');
    const point0 = get(this, 'newLineStartingPoint');
    let point1 = point;

    if (snapToGrid) {
      point1 = editor.snapPointToGrid(point);
    }

    // The line would still have zero length, don't do anything yet
    
    if (get(point0, 'x') === get(point1, 'x') && get(point0, 'y') === get(point1, 'y')) {
      return;
    }

    editor.sendAction('addPoint', point0);
    editor.sendAction('addPoint', point1);

    run.next(() => {
      editor.sendAction('selectPoint', get(editor, 'path.points.lastObject.id'));

      set(this, 'handleBeingMoved', get(editor, 'path.points.1'));
      set(this, 'newLineStartingPoint', null);

      this.moveHandle(point, snapToGrid);
    });
  },

  moveSelectedHandlesOnGrid(dx, dy) {
    const editor = get(this, 'editor');
    const path = get(editor, 'path');

    if (path) {
      const selectedEventIds = get(editor, 'selectedEventIds');
      const handles = get(path, 'points').filter(point => selectedEventIds.includes(get(point, 'id')));
      const gridSize = get(editor, 'gridSize');

      handles.forEach(handle => handle.move({
        dx: gridSize * dx,
        dy: gridSize * dy
      }));

      if (handles.length) {
        editor.sendAction('pathDidChange');
      }
    }
  },

  deleteSelectedHandles() {
    const editor = get(this, 'editor');
    const selectedEventIds = get(editor, 'selectedEventIds');
    const path = get(editor, 'path');

    if (path) {
      const points = get(path, 'points').filter(point => selectedEventIds.includes(get(point, 'id')));

      path.removePoints(points);
      editor.sendAction('selectPoint', null);
      editor.sendAction('pathDidChange');
    }
  },

  highlightHandle(point) {
    const editor = get(this, 'editor');
    const handle = this.getPathHandlesAtPoint(point)[0];
    const handleId = handle ? get(handle, 'id') : null;
    
    editor.sendAction('highlightEvent', handleId);
  }
});

function guard() {
  this._super(...arguments);
  return get(this, 'tool') !== 'path' || get(this, 'isDestroying');
}

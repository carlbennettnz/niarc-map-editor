import Ember from 'ember';
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

  selectAllPoints() {
    const editor = get(this, 'editor');
    const points = get(editor, 'path.points');

    // Deselect all
    editor.sendAction('selectPoint', null);

    points.forEach(point => {
      editor.sendAction('togglePointSelection', get(point, 'id'));
    });
  },

  deselectAllPoints() {
    const editor = get(this, 'editor');

    editor.sendAction('selectPoint', null);
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
